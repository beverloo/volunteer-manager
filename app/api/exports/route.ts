// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { NextRequest } from 'next/server';
import { forbidden } from 'next/navigation';
import { z } from 'zod';

import type { ApiDefinition, ApiRequest, ApiResponse } from '../Types';
import { type ActionProps, executeAction } from '../Action';
import { type VendorTeam, kExportType, kRegistrationStatus, kVendorTeam } from '@lib/database/Types';
import { RecordLog, kLogType } from '@lib/Log';
import { Temporal, formatDate } from '@lib/Temporal';
import { readSetting } from '@lib/Settings';

import db, { tEvents, tExports, tExportsLogs, tRefunds, tRoles, tTrainings, tTrainingsAssignments,
    tTrainingsExtra, tUsers, tUsersEvents, tVendors } from '@lib/database';

/**
 * Data export type definition for credit reel consent.
 */
const kCreditsDataExport = z.object({
    /**
     * Array of volunteers who have declined inclusion in the credit reel.
     */
    declined: z.array(z.string()),

    /**
     * Array of roles & associated volunteers who want to be included in the credit reel.
     */
    included: z.array(z.object({
        /**
         * Name of the role this group of volunteers belongs to.
         */
        role: z.string(),

        /**
         * Volunteers who are to be listed as part of this role.
         */
        volunteers: z.array(z.string()),
    })),
});

/**
 * Data export type definition for refund requests.
 */
const kRefundsDataExport = z.object({
    /**
     * Array of the refund requests that were issued for this event.
     */
    requests: z.array(z.object({
        /**
         * Date and time on which the refund request was received.
         */
        date: z.string(),

        /**
         * Full name of the volunteer who requested the refund.
         */
        name: z.string(),

        /**
         * Ticket number (optional) of the volunteer's purchased ticket.
         */
        ticketNumber: z.string().optional(),

        /**
         * Account IBAN to which the refund should be issued.
         */
        accountIban: z.string(),

        /**
         * Accound holder name of the account to which the refund should be issued.
         */
        accountName: z.string(),
    })),
});

/**
 * Data export type definition for training participation.
 */
const kTrainingsDataExport = z.object({
    /**
     * Array of dates & associated volunteers who will participate in our training sessions.
     */
    sessions: z.array(z.object({
        /**
         * Date and time on which the training will commence.
         */
        date: z.string(),

        /**
         * Array of the volunteers who will participate in this training session.
         */
        volunteers: z.array(z.object({
            /**
             * Name of the volunteer.
             */
            name: z.string(),

            /**
             * E-mail address through which the volunteer can be reached.
             */
            email: z.string(),

            /**
             * Birthdate on which the volunteer was born. (YYYY-MM-DD)
             */
            birthdate: z.string(),
        })),
    })),
});

/**
 * Data export type definition for volunteer participation. This follows the structure that is
* preferred by the AnimeCon Desk team.
 */
const kVolunteersDataExport = z.array(z.object({
    /**
     * Department that the volunteer is part of.
     */
    department: z.string(),

    /**
     * Role that the volunteer has been assigned within that department.
     */
    role: z.string(),

    /**
     * E-mail address through which the volunteer should receive their ticket.
     */
    email: z.string(),

    /**
     * The volunteer's first name.
     */
    firstName: z.string(),

    /**
     * The volunteer's prefix, if any.
     */
    prefix: z.string(),

    /**
     * The volunteer's last name.
     */
    lastName: z.string(),

    /**
     * The volunteer's gender.
     */
    gender: z.string(),

    /**
     * Age of the volunteer at time of the convention.
     */
    age: z.number().optional(),

    /**
     * Size of the shirt they would like. Not validated, as we validate this plenty elsewhere.
     */
    shirtSize: z.string().optional(),

    /**
     * Fit of the shirt they would like. "Regular" or "Girly".
     */
    shirtFit: z.string().optional(),
}));

/**
 * Export the aforementioned type definitions for use elsewhere in the Volunteer Manager.
 */
export type CreditsDataExport = z.infer<typeof kCreditsDataExport>;
export type RefundsDataExport = z.infer<typeof kRefundsDataExport>;
export type TrainingsDataExport = z.infer<typeof kTrainingsDataExport>;
export type VolunteersDataExport = z.infer<typeof kVolunteersDataExport>;

/**
 * Interface definition for the Exports API, exposed through /api/exports.
 */
const kExportsDefinition = z.object({
    request: z.object({
        /**
         * Unique slug associated with the data export. These are random and non-incremental.
         */
        slug: z.string().min(1),
    }),
    response: z.object({
        /**
         * Whether the data could be accessed successfully.
         */
        success: z.boolean(),

        /**
         * Optional error message, only considered when `success` is set to `false`.
         */
        error: z.string().optional(),

        /**
         * Credit reel consent data export, when the `slug` describes that kind of export.
         */
        credits: kCreditsDataExport.optional(),

        /**
         * Refund request data export, when the `slug` desccribes that kind of export.
         */
        refunds: kRefundsDataExport.optional(),

        /**
         * Training participation data export, when the `slug` desccribes that kind of export.
         */
        trainings: kTrainingsDataExport.optional(),

        /**
         * Volunteer participation data export, when the `slug` describes that kind of export.
         */
        volunteers: kVolunteersDataExport.optional(),
    }),
});

export type ExportsDefinition = ApiDefinition<typeof kExportsDefinition>;

type Request = ApiRequest<typeof kExportsDefinition>;
type Response = ApiResponse<typeof kExportsDefinition>;

/**
 * Threshold, in milliseconds, within which reloads of the data will be ignored for logging
 * purposes. This ensures that fast subsequent access does not needlessly affect view limits.
 */
const kReloadIgnoreThreshold = 5 /* = minutes */ * 60 * 1000;

/**
 * API through which volunteers can update their training preferences.
 */
async function exports(request: Request, props: ActionProps): Promise<Response> {
    if (!props.ip)
        forbidden();

    const exportsLogsJoin = tExportsLogs.forUseInLeftJoin();

    const dbInstance = db;
    const metadata = await dbInstance.selectFrom(tExports)
        .innerJoin(tEvents)
            .on(tEvents.eventId.equals(tExports.exportEventId))
        .leftJoin(exportsLogsJoin)
            .on(exportsLogsJoin.exportId.equals(tExports.exportId))
        .where(tExports.exportSlug.equals(request.slug))
            .and(tExports.exportEnabled.equals(/* true= */ 1))
            .and(tExports.exportExpirationDate.greaterThan(dbInstance.currentZonedDateTime()))
        .select({
            id: tExports.exportId,
            eventId: tExports.exportEventId,
            eventName: tEvents.eventShortName,
            eventStartTime: tEvents.eventStartTime,
            type: tExports.exportType,

            maximumViews: tExports.exportExpirationViews,
            views: dbInstance.count(exportsLogsJoin.exportLogId),
        })
        .groupBy(tExports.exportId)
        .having(tExports.exportExpirationViews.greaterThan(
            dbInstance.count(exportsLogsJoin.exportLogId)))
        .executeSelectNoneOrOne();

    if (!metadata)
        return { success: false, error: 'The data is no longer available, please refresh' };

    const lastLogEntryDateTime = await dbInstance.selectFrom(tExportsLogs)
        .where(tExportsLogs.exportId.equals(metadata.id))
            .and(tExportsLogs.accessIpAddress.equals(props.ip))
        .selectOneColumn(tExportsLogs.accessDate)
        .orderBy(tExportsLogs.accessDate, 'desc')
        .limit(/* only the latest= */ 1)
        .executeSelectNoneOrOne();

    const millisecondsSinceLastLogEntry =
        lastLogEntryDateTime?.until(Temporal.Now.zonedDateTimeISO('UTC'), {
            largestUnit: 'millisecond'
        }).milliseconds;

    if (!millisecondsSinceLastLogEntry || millisecondsSinceLastLogEntry > kReloadIgnoreThreshold) {
        await dbInstance.insertInto(tExportsLogs)
            .set({
                exportId: metadata.id,
                accessDate: dbInstance.currentZonedDateTime(),
                accessIpAddress: props.ip,
                accessUserAgent: props.requestHeaders.get('user-agent') ?? '(unknown)',
                accessUserId: props.user?.userId,
            })
            .executeInsert();

        RecordLog({
            type: kLogType.ExportDataAccess,
            sourceUser: props.user,
            data: {
                event: metadata.eventName,
                type: metadata.type,
                ip: props.ip,
            }
        });
    }

    let credits: CreditsDataExport | undefined = undefined;
    if (metadata.type === kExportType.Credits) {
        credits = { declined: [], included: [] };

        const volunteers = await db.selectFrom(tUsersEvents)
            .innerJoin(tUsers)
                .on(tUsers.userId.equals(tUsersEvents.userId))
            .innerJoin(tRoles)
                .on(tRoles.roleId.equals(tUsersEvents.roleId))
            .where(tUsersEvents.eventId.equals(metadata.eventId))
                .and(tUsersEvents.registrationStatus.equals(kRegistrationStatus.Accepted))
            .select({
                name: tUsers.name,
                role: tRoles.roleName,
                included: tUsersEvents.includeCredits.valueWhenNull(/* true= */ 1),
            })
            .orderBy(tRoles.roleOrder, 'asc')
            .orderBy(tRoles.roleName, 'asc')
            .orderBy('name', 'asc')
            .executeSelectMany();

        let currentRoleGroup: string[] = [];
        let currentRole: string | null = null;

        for (const volunteer of volunteers) {
            if (!volunteer.included) {
                credits.declined.push(volunteer.name);
            } else {
                if (currentRole !== volunteer.role) {
                    if (currentRole && currentRoleGroup.length > 0) {
                        credits.included.push({
                            role: currentRole,
                            volunteers: currentRoleGroup
                        });
                    }

                    currentRoleGroup = [];
                    currentRole = volunteer.role;
                }

                currentRoleGroup.push(volunteer.name);
            }
        }

        if (currentRole && currentRoleGroup.length > 0) {
            credits.included.push({
                role: currentRole,
                volunteers: currentRoleGroup
            });
        }
    }

    let refunds: RefundsDataExport | undefined = undefined;
    if (metadata.type === kExportType.Refunds) {
        refunds = { requests: [] };

        const refundRequests = await db.selectFrom(tUsersEvents)
            .innerJoin(tRefunds)
                .on(tRefunds.eventId.equals(tUsersEvents.eventId))
                .and(tRefunds.userId.equals(tUsersEvents.userId))
            .innerJoin(tUsers)
                .on(tUsers.userId.equals(tUsersEvents.userId))
            .where(tUsersEvents.eventId.equals(metadata.eventId))
            .select({
                date: tRefunds.refundRequested,
                name: tUsers.name,
                ticketNumber: tRefunds.refundTicketNumber,
                accountIban: tRefunds.refundAccountIban,
                accountName: tRefunds.refundAccountName,
            })
            .orderBy('name', 'asc')
            .executeSelectMany();

        for (const request of refundRequests) {
            refunds.requests.push({
                date: request.date.toString(),
                name: request.name,
                ticketNumber: request.ticketNumber,
                accountIban: request.accountIban,
                accountName: request.accountName,
            });
        }
    }

    let trainings: TrainingsDataExport | undefined = undefined;
    if (metadata.type === kExportType.Trainings) {
        trainings = { sessions: [] };

        const trainingsExtraJoin = tTrainingsExtra.forUseInLeftJoin();
        const usersJoin = tUsers.forUseInLeftJoin();

        const dbInstance = db;
        const participants = await dbInstance.selectFrom(tTrainingsAssignments)
            .innerJoin(tTrainings)
                .on(tTrainings.trainingId.equals(tTrainingsAssignments.assignmentTrainingId))
            .leftJoin(trainingsExtraJoin)
                .on(trainingsExtraJoin.trainingExtraId.equals(
                    tTrainingsAssignments.assignmentExtraId))
            .leftJoin(usersJoin)
                .on(usersJoin.userId.equals(tTrainingsAssignments.assignmentUserId))
            .where(tTrainingsAssignments.eventId.equals(metadata.eventId))
                .and(tTrainingsAssignments.assignmentConfirmed.equals(/* true= */ 1))
            .select({
                date: tTrainings.trainingStart,
                name: trainingsExtraJoin.trainingExtraName.valueWhenNull(usersJoin.name),
                email: trainingsExtraJoin.trainingExtraEmail.valueWhenNull(usersJoin.username),
                birthdate: trainingsExtraJoin.trainingExtraBirthdate.valueWhenNull(
                    usersJoin.birthdate),
            })
            .orderBy('date', 'asc')
            .orderBy('name', 'asc')
            .executeSelectMany();

        let currentVolunteers: TrainingsDataExport['sessions'][number]['volunteers'] = [];
        let currentDate: string | null = null;

        for (const participant of participants) {
            const participationDate = formatDate(participant.date, 'YYYY-MM-DD');
            if (currentDate !== participationDate) {
                if (currentDate && currentVolunteers.length > 0) {
                    trainings.sessions.push({
                        date: currentDate,
                        volunteers: currentVolunteers,
                    });
                }

                currentDate = participationDate;
                currentVolunteers = [];
            }

            currentVolunteers.push({
                name: participant.name ?? '(unknown)',
                email: participant.email ?? 'crew@animecon.nl',
                birthdate: participant.birthdate ? participant.birthdate.toString()
                                                 : '2030-01-01',
            });
        }

        if (currentDate && currentVolunteers.length > 0) {
            trainings.sessions.push({
                date: currentDate,
                volunteers: currentVolunteers,
            });
        }
    }

    let volunteers: VolunteersDataExport | undefined = undefined;
    if (metadata.type === kExportType.Volunteers) {
        volunteers = [];

        // What is the e-mail address that tickets for first aiders should be send to?
        const firstAidEmailAddress =
            await readSetting('vendor-first-aid-email-address') ?? 'crew@animecon.nl';

        // What is the department that all our volunteers should be part of?
        const kDepartment = 'HR & Security';

        // Full names of volunteers who have already been seen in the list.
        const seenVolunteers = new Set<string>;

        const volunteerList = await db.selectFrom(tUsersEvents)
            .innerJoin(tUsers)
                .on(tUsers.userId.equals(tUsersEvents.userId))
            .innerJoin(tRoles)
                .on(tRoles.roleId.equals(tUsersEvents.roleId))
            .where(tUsersEvents.eventId.equals(metadata.eventId))
                .and(tUsersEvents.registrationStatus.equals(kRegistrationStatus.Accepted))
            .select({
                role: tRoles.roleName,
                username: tUsers.username,
                firstName: tUsers.firstName,
                lastName: tUsers.lastName,
                gender: tUsers.gender,
                birthdate: tUsers.birthdate,
                shirtSize: tUsersEvents.shirtSize,
                shirtFit: tUsersEvents.shirtFit,
            })
            .orderBy(tRoles.roleOrder, 'asc')
            .orderBy(tUsers.lastName, 'asc')
            .orderBy(tUsers.firstName, 'asc')
            .executeSelectMany();

        for (const volunteer of volunteerList) {
            let age: number | undefined = undefined;

            if (volunteer.birthdate) {
                const eventStartDay = metadata.eventStartTime.toPlainDate();
                const difference = eventStartDay.since(volunteer.birthdate, {
                    largestUnit: 'years',
                });

                age = difference.years;
            }

            seenVolunteers.add(`${volunteer.firstName} ${volunteer.lastName}`);

            volunteers.push({
                department: kDepartment,
                role: volunteer.role,
                email: volunteer.username!,
                firstName: volunteer.firstName,
                prefix: '',
                lastName: volunteer.lastName,
                gender: volunteer.gender,
                age,
                shirtSize: volunteer.shirtSize,
                shirtFit: volunteer.shirtFit,
            });
        }

        const vendorList = await db.selectFrom(tVendors)
            .where(tVendors.eventId.equals(metadata.eventId))
                .and(tVendors.vendorVisible.equals(/* true= */ 1))
                .and(tVendors.vendorTeam.equals(kVendorTeam.FirstAid))
            .select({
                team: tVendors.vendorTeam,
                firstName: tVendors.vendorFirstName,
                lastName: tVendors.vendorLastName,
                gender: tVendors.vendorGender,
                shirtFit: tVendors.vendorShirtFit,
                shirtSize: tVendors.vendorShirtSize,
            })
            .orderBy(tVendors.vendorLastName, 'asc')
            .orderBy(tVendors.vendorFirstName, 'asc')
            .executeSelectMany();

        const kVendorTeamToRoleMapping: { [k in VendorTeam]: string } = {
            [kVendorTeam.FirstAid]: 'First Aid',
            [kVendorTeam.Security]: 'Security',
        };

        for (const vendor of vendorList) {
            if (seenVolunteers.has(`${vendor.firstName} ${vendor.lastName}`))
                continue;  // they will already be receiving another ticket

            volunteers.push({
                department: kDepartment,
                role: kVendorTeamToRoleMapping[vendor.team],
                email: firstAidEmailAddress,
                firstName: vendor.firstName,
                prefix: '',
                lastName: vendor.lastName,
                gender: vendor.gender,
                shirtSize: vendor.shirtSize,
                shirtFit: vendor.shirtFit,
            });
        }
    }

    return {
        success: true,
        credits, refunds, trainings, volunteers,
    };
}

// The /api/exports route only provides a single API - call it straight away.
export const POST = (request: NextRequest) => executeAction(request, kExportsDefinition, exports);
