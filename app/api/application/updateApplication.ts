// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';
import { z } from 'zod';

import { type ActionProps, noAccess } from '../Action';
import { LogSeverity, LogType, Log } from '@lib/Log';
import { Privilege, can } from '@lib/auth/Privileges';
import { RegistrationStatus } from '@lib/database/Types';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import db, { tEvents, tEventsTeams, tTeams, tUsersEvents } from '@lib/database';

import { kApplicationProperties } from '../event/application';

/**
 * Interface definition for the Application API, exposed through /api/application/
 */
export const kUpdateApplicationDefinition = z.object({
    request: z.object({
        /**
         * Slug of the event this is in context of; passed in the URL.
         */
        event: z.string(),

        /**
         * Slug of the team the application is part of; passed in the URL.
         */
        team: z.string(),

        /**
         * Unique ID of the user whose application should be updated; passed in the URL.
         */
        userId: z.coerce.number(),

        //------------------------------------------------------------------------------------------
        // Update type (1): Application data
        //------------------------------------------------------------------------------------------

        data: z.object(kApplicationProperties).optional(),

        //------------------------------------------------------------------------------------------
        // Update type (2): Application metadata
        //------------------------------------------------------------------------------------------

        metadata: z.object({
            /**
             * The date on which this volunteer created their application. May be NULL.
             */
            registrationDate: z.string().optional(),

            /**
             * Whether this volunteer is eligible for a hotel room beyond conventional rules.
             */
            hotelEligible: z.number().optional(),

            /**
             * Whether this volunteer is eligible to join the training beyond conventional rules.
             */
            trainingEligible: z.number().optional(),

        }).optional(),

        //------------------------------------------------------------------------------------------
        // Update type (3): Application status
        //------------------------------------------------------------------------------------------

        status: z.object({
            /**
             * The registration status that the volunteer should be updated to.
             */
            registrationStatus: z.nativeEnum(RegistrationStatus),

            /**
             * Subject of the message that should be sent out. May be omitted for certain users.
             */
            subject: z.string().optional(),

            /**
             * Message that should be sent out. May be omitted for certain volunteers.
             */
            message: z.string().optional(),

        }).optional(),
    }),
    response: z.strictObject({
        /**
         * Whether the appliation was updated successfully.
         */
        success: z.boolean(),
    }),
});

export type UpdateApplicationDefinition = z.infer<typeof kUpdateApplicationDefinition>;

type Request = UpdateApplicationDefinition['request'];
type Response = UpdateApplicationDefinition['response'];

/**
 * API that allows an application to be updated.
 */
export async function updateApplication(request: Request, props: ActionProps): Promise<Response> {
    if (!props.user)
        noAccess();

    const requestContext = await db.selectFrom(tEventsTeams)
        .innerJoin(tEvents)
            .on(tEvents.eventId.equals(tEventsTeams.eventId))
            .and(tEvents.eventSlug.equals(request.event))
        .innerJoin(tTeams)
            .on(tTeams.teamId.equals(tEventsTeams.teamId))
            .and(tTeams.teamEnvironment.equals(request.team))
        .where(tEventsTeams.enableTeam.equals(/* true= */ 1))
        .select({
            event: tEvents.eventShortName,
            eventId: tEvents.eventId,
            teamId: tTeams.teamId,
        })
        .executeSelectNoneOrOne();

    if (!requestContext)
        notFound();

    const { eventId, teamId } = requestContext;

    let affectedRows: number = 0;

    //----------------------------------------------------------------------------------------------
    // Update type (1): Application data
    //----------------------------------------------------------------------------------------------

    if (request.data) {
        executeAccessCheck(props.authenticationContext, {
            check: 'admin-event',
            event: request.event,
        });

        const [ preferenceTimingStart, preferenceTimingEnd ] =
            request.data.serviceTiming.split('-').map(v => parseInt(v, 10));

        affectedRows = await db.update(tUsersEvents)
            .set({
                shirtFit: request.data.tshirtFit as any,
                shirtSize: request.data.tshirtSize as any,
                preferences: request.data.preferences,
                preferenceHours: parseInt(request.data.serviceHours, 10),
                preferenceTimingStart, preferenceTimingEnd,
                includeCredits: request.data.credits ? 1 : 0,
                includeSocials: request.data.socials ? 1 : 0,
            })
            .where(tUsersEvents.userId.equals(request.userId))
                .and(tUsersEvents.eventId.equals(eventId))
                .and(tUsersEvents.teamId.equals(teamId))
            .executeUpdate(/* min= */ 0, /* max= */ 1);
    }

    //----------------------------------------------------------------------------------------------
    // Update type (2): Application metadata
    //----------------------------------------------------------------------------------------------

    if (request.metadata) {
        executeAccessCheck(props.authenticationContext, {
            check: 'admin-event',
            event: request.event,
            privilege: Privilege.EventVolunteerApplicationOverrides,
        });

        affectedRows = await db.update(tUsersEvents)
            .set({
                hotelEligible: request.metadata.hotelEligible,
                trainingEligible: request.metadata.trainingEligible,
                registrationDate:
                    request.metadata.registrationDate ? new Date(request.metadata.registrationDate)
                                                      : null,
            })
            .where(tUsersEvents.userId.equals(request.userId))
                .and(tUsersEvents.eventId.equals(eventId))
                .and(tUsersEvents.teamId.equals(teamId))
            .executeUpdate(/* min= */ 0, /* max= */ 1);
    }

    //----------------------------------------------------------------------------------------------
    // Update type (3): Application status
    //----------------------------------------------------------------------------------------------

    if (request.status) {
        switch (request.status.registrationStatus) {
            // Accept and approve applications; cancel and re-instate volunteers:
            case RegistrationStatus.Accepted:
            case RegistrationStatus.Cancelled:
            case RegistrationStatus.Rejected:
                executeAccessCheck(props.authenticationContext, {
                    check: 'admin-event',
                    event: request.event,
                    privilege: Privilege.EventApplicationManagement,
                });

                break;

            // Reconsider previously rejected applications:
            case RegistrationStatus.Registered:
                executeAccessCheck(props.authenticationContext, {
                    check: 'admin-event',
                    event: request.event,
                    privilege: Privilege.EventAdministrator,
                });

                break;
        }

        if (request.status.registrationStatus !== RegistrationStatus.Registered) {
            const { subject, message } = request.status;
            if (!subject || !message) {
                if (!can(props.user, Privilege.VolunteerSilentMutations))
                    noAccess();

            } else {
                // TODO: Inform the volunteer w/ request.status.{message, subject}
            }
        }

        affectedRows = await db.update(tUsersEvents)
            .set({
                registrationStatus: request.status.registrationStatus,
            })
            .where(tUsersEvents.userId.equals(request.userId))
                .and(tUsersEvents.eventId.equals(eventId))
                .and(tUsersEvents.teamId.equals(teamId))
            .executeUpdate(/* min= */ 0, /* max= */ 1);

        await Log({
            type: LogType.AdminUpdateTeamVolunteerStatus,
            severity: LogSeverity.Warning,
            sourceUser: props.user,
            targetUser: request.userId,
            data: {
                action: request.status.registrationStatus.replace('Registered', 'Reset'),
                event: requestContext.event,
                eventId, teamId,
            },
        });

        return { success: !!affectedRows };
    }

    // ---------------------------------------------------------------------------------------------

    if (!!affectedRows) {
        await Log({
            type: LogType.AdminUpdateTeamVolunteer,
            severity: LogSeverity.Info,
            sourceUser: props.user,
            targetUser: request.userId,
            data: {
                event: requestContext.event,
                eventId, teamId,
            },
        });
    }

    return { success: !!affectedRows };
}
