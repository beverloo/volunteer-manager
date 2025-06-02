// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';
import { z } from 'zod/v4';

import { Publish } from '@lib/subscriptions';
import { RecordLog, kLogSeverity, kLogType } from '@lib/Log';
import { SendEmailTask } from '@lib/scheduler/tasks/SendEmailTask';
import { Temporal } from '@lib/Temporal';
import { determineAvailabilityStatus } from '@lib/EnvironmentContext';
import { executeServerAction } from '@lib/serverAction';
import { getStaticContent } from '@lib/Content';
import db, { tEnvironments, tEvents, tEventsTeams, tRefunds, tTeams, tTeamsRoles, tUsersEvents } from '@lib/database';

import { kRegistrationStatus, kShirtFit, kShirtSize, kSubscriptionType } from '@lib/database/Types';

/**
 * Number of hours that the volunteer would like to help us out with.
 */
export const kServiceHoursProperty = z.enum([ '12', '16', '20', '24' ]);

/**
 * Timing of the shifts the volunteer would like to fulfill.
 */
export const kServiceTimingProperty = z.enum([ '8-20', '10-0', '14-3' ]);

/**
 * Zod type that describes the data required when creating an application.
 */
const kCreateApplicationData = z.object({
    tshirtSize: z.enum(kShirtSize),
    tshirtFit: z.enum(kShirtFit),

    serviceHours: kServiceHoursProperty,
    serviceTiming: kServiceTimingProperty,

    preferences: z.string().optional(),

    availability: z.boolean(),
    credits: z.boolean(),
    socials: z.boolean(),
});

/**
 * Server action that creates a new environment in the Volunteer Manager.
 */
export async function createApplication(eventId: number, teamId: number, formData: unknown) {
    'use server';
    return executeServerAction(formData, kCreateApplicationData, async (data, props) => {
        if (!props.user)
            return { success: false, error: 'You need to be signed in to your account…' };

        const dbInstance = db;

        // -----------------------------------------------------------------------------------------
        // Validate the |eventId| and the |teamId| to confirm that they exist and are associated
        // with each other, i.e. that the team participates in the event.
        // -----------------------------------------------------------------------------------------

        const eventInfo = await dbInstance.selectFrom(tEvents)
            .where(tEvents.eventId.equals(eventId))
            .select({
                shortName: tEvents.eventShortName,
                slug: tEvents.eventSlug,
            })
            .executeSelectNoneOrOne();

        if (!eventInfo)
            return { success: false, error: 'Unable to identify the appropriate event…' };

        const teamInfo = await dbInstance.selectFrom(tTeams)
            .innerJoin(tTeamsRoles)
                .on(tTeamsRoles.teamId.equals(tTeams.teamId))
                    .and(tTeamsRoles.roleDefault.equals(/* true= */ 1))
            .innerJoin(tEventsTeams)
                .on(tEventsTeams.teamId.equals(tTeams.teamId))
                    .and(tEventsTeams.eventId.equals(eventId))
                    .and(tEventsTeams.enableTeam.equals(/* true= */ 1))
            .innerJoin(tEnvironments)
                .on(tEnvironments.environmentId.equals(tTeams.teamEnvironmentId))
            .where(tTeams.teamId.equals(teamId))
                .and(tTeams.teamDeleted.isNull())
            .select({
                defaultRoleId: tTeamsRoles.roleId,
                domain: tEnvironments.environmentDomain,
                name: tTeams.teamName,
                slug: tTeams.teamSlug,
                title: tTeams.teamTitle,

                applicationWindow: {
                    start: tEventsTeams.enableApplicationsStart,
                    end: tEventsTeams.enableApplicationsEnd,
                },
            })
            .executeSelectNoneOrOne();

        if (!teamInfo)
            return { success: false, error: 'Unable to identify the appropriate team…' };

        // -----------------------------------------------------------------------------------------
        // Validate that the team is presently accepting applications.
        // -----------------------------------------------------------------------------------------

        const currentTime = Temporal.Now.zonedDateTimeISO('utc');

        const availabilityStatus = determineAvailabilityStatus(currentTime, {
            ...teamInfo.applicationWindow,
            override: props.access.can('event.visible', {
                event: eventInfo.slug,
                team: teamInfo.slug,
            }),
        });

        switch (availabilityStatus) {
            case 'future':
                return { success: false, error: 'Sorry, applications are not being accepted yet…' };

            case 'past':
                return { success: false, error: 'Sorry, applications are no longer accepted…' };

            case 'active':
            case 'override':
                break;
        }

        // -----------------------------------------------------------------------------------------
        // Validate that the volunteer does not have an existing application with this team yet.
        // -----------------------------------------------------------------------------------------

        const existingApplication = await dbInstance.selectFrom(tUsersEvents)
            .where(tUsersEvents.userId.equals(props.user.userId))
                .and(tUsersEvents.eventId.equals(eventId))
                .and(tUsersEvents.teamId.equals(teamId))
            .selectCountAll()
            .executeSelectNoneOrOne() ?? 0;

        if (existingApplication > 0)
            return { success: false, error: 'You already have an active application…' };

        // -----------------------------------------------------------------------------------------
        // Submit the application.
        // -----------------------------------------------------------------------------------------

        const [ preferenceTimingStart, preferenceTimingEnd ] =
            data.serviceTiming.split('-').map(v => parseInt(v, 10));

        const affectedRows = await dbInstance.insertInto(tUsersEvents)
            .set({
                userId: props.user.userId,
                eventId,
                teamId,
                roleId: teamInfo.defaultRoleId,
                registrationDate: dbInstance.currentZonedDateTime(),
                registrationStatus: kRegistrationStatus.Registered,
                shirtFit: data.tshirtFit,
                shirtSize: data.tshirtSize,
                preferenceHours: parseInt(data.serviceHours, 10),
                preferenceTimingStart, preferenceTimingEnd,
                preferences: data.preferences,
                preferencesUpdated: dbInstance.currentZonedDateTime(),
                fullyAvailable: data.availability ? 1 : 0,
                includeCredits: data.credits ? 1 : 0,
                includeSocials: data.socials ? 1 : 0,
            })
            .executeInsert();

        if (!affectedRows)
            return { success: false, error: 'Unable to store the application in the database…' };

        // -----------------------------------------------------------------------------------------
        // Tell the world about this application. This starts by writing a log entry, after which
        // we publish the event and send an e-mail to the volunteer to confirm their action.
        // -----------------------------------------------------------------------------------------

        RecordLog({
            type: kLogType.EventApplication,
            sourceUser: props.user,
            data: {
                event: eventInfo.shortName,
                team: teamInfo.name,
            },
        });

        const applicationConfirmation =
            await getStaticContent([ 'message', 'application-confirmation' ], {
                event: eventInfo.shortName,
                eventSlug: eventInfo.slug,
                hostname: teamInfo.domain,
                name: props.user.firstName,
                team: teamInfo.name,
            });

        if (applicationConfirmation) {
            await SendEmailTask.Schedule({
                sender: `AnimeCon ${teamInfo.title}`,
                message: {
                    to: props.user.username!,
                    subject: applicationConfirmation.title,
                    markdown: applicationConfirmation.markdown,
                },
                attribution: {
                    sourceUserId: props.user.userId,
                    targetUserId: props.user.userId,
                },
            });
        }

        await Publish({
            type: kSubscriptionType.Application,
            typeId: teamId,
            sourceUserId: props.user.userId,
            message: {
                userId: props.user.userId,
                name: props.user.name,
                event: eventInfo.shortName,
                eventSlug: eventInfo.slug,
                teamEnvironment: teamInfo.domain,
                teamName: teamInfo.name,
                teamSlug: teamInfo.slug,
                teamTitle: teamInfo.title,
            },
        });

        // -----------------------------------------------------------------------------------------
        // Conclude the application process. Refreshing the page will show them the progress of
        // their in-progress application(s), even when there are multiple.
        // -----------------------------------------------------------------------------------------

        return { success: true, refresh: true };
    });
}

/**
 * Zod type that describes the data required when creating an application.
 */
const kRequestRefundData = z.object({
    ticketNumber: z.string().optional(),
    accountIban: z.string().min(1),
    accountName: z.string().min(1),
});

/**
 * Server action that requests a refund on behalf of the signed in user.
 */
export async function requestRefund(eventId: number, formData: unknown) {
    'use server';
    return executeServerAction(formData, kRequestRefundData, async (data, props) => {
        if (!props.user)
            return { success: false, error: 'You need to be signed in to your account…' };

        const dbInstance = db;

        const event = await dbInstance.selectFrom(tEvents)
            .where(tEvents.eventId.equals(eventId))
            .select({
                shortName: tEvents.eventShortName,
                slug: tEvents.eventSlug,
            })
            .executeSelectNoneOrOne();

        if (!event)
            notFound();

        // -----------------------------------------------------------------------------------------
        // Confirm whether the signed in user has the ability to submit a refund request right now.
        // -----------------------------------------------------------------------------------------

        if (!props.access.can('event.refunds', { event: event.slug })) {
            const availability = await dbInstance.selectFrom(tEvents)
                .where(tEvents.eventId.equals(eventId))
                .select({
                    refundRequestsStart: tEvents.refundRequestsStart,
                    refundRequestsEnd: tEvents.refundRequestsEnd,
                })
                .executeSelectOne();

            if (!availability.refundRequestsStart || !availability.refundRequestsEnd)
                return { success: false, error: 'Sorry, refunds are not being accepted…' };

            const currentTime = Temporal.Now.zonedDateTimeISO('utc');
            if (Temporal.ZonedDateTime.compare(currentTime, availability.refundRequestsStart) < 0)
                return { success: false, error: 'Sorry, refunds are not being accepted yet…' };
            if (Temporal.ZonedDateTime.compare(currentTime, availability.refundRequestsEnd) >= 0)
                return { success: false, error: 'Sorry, refunds are not being accepted anymore…' };
        }

        // -----------------------------------------------------------------------------------------
        // Actually submit the refund request in the database.
        // -----------------------------------------------------------------------------------------

        const affectedRows = await dbInstance.insertInto(tRefunds)
            .set({
                userId: props.user.userId,
                eventId: eventId,

                refundTicketNumber: data.ticketNumber,
                refundAccountIban: data.accountIban,
                refundAccountName: data.accountName,
                refundRequested: dbInstance.currentZonedDateTime(),
            })
            .onConflictDoUpdateSet({
                refundTicketNumber: data.ticketNumber,
                refundAccountIban: data.accountIban,
                refundAccountName: data.accountName,
                refundRequested: dbInstance.currentZonedDateTime(),
            })
            .executeInsert();

        if (!affectedRows)
            return { success: false, error: 'Unable to store your request in the database…' };

        RecordLog({
            type: kLogType.ApplicationRefundRequest,
            severity: kLogSeverity.Info,
            sourceUser: props.user,
            data: {
                event: event.shortName,
            },
        });

        return { success: true, refresh: true };
    });
}
