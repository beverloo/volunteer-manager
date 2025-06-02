// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { forbidden, notFound } from 'next/navigation';
import { z } from 'zod/v4';

import type { ActionProps } from '../Action';
import { RecordLog, kLogSeverity, kLogType } from '@lib/Log';
import { SendEmailTask } from '@lib/scheduler/tasks/SendEmailTask';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import db, { tEvents, tEventsTeams, tTeams, tUsersEvents, tUsers } from '@lib/database';

import { kRegistrationStatus, kShirtFit, kShirtSize } from '@lib/database/Types';
import { kTemporalZonedDateTime, type ApiDefinition, type ApiRequest, type ApiResponse }
    from '../Types';

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

        data: z.object({
            /**
             * Whether the volunteer would like their name to be included in the credit reel.
             */
            credits: z.boolean(),

            /**
             * Whether the volunteer would like to join our social media channels.
             */
            socials: z.boolean(),

            /**
             * Fit for the t-shirt that the volunteer would like to receive as a thank you.
             */
            tshirtFit: z.nativeEnum(kShirtFit),

            /**
             * Size of the t-shirt that the volunteer would like to receive as a thank you.
             */
            tshirtSize: z.nativeEnum(kShirtSize),

        }).optional(),

        //------------------------------------------------------------------------------------------
        // Update type (2): Application metadata
        //------------------------------------------------------------------------------------------

        metadata: z.object({
            /**
             * The date on which this volunteer created their application. May be NULL.
             */
            registrationDate: kTemporalZonedDateTime.optional(),

            /**
             * The number of events the volunteer can indicate they really want to attend.
             */
            availabilityEventLimit: z.number().min(0).max(100).optional(),

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
        // Update type (3): Notes
        //------------------------------------------------------------------------------------------

        notes: z.string().optional(),

        //------------------------------------------------------------------------------------------
        // Update type (4): Application status
        //------------------------------------------------------------------------------------------

        status: z.object({
            /**
             * The registration status that the volunteer should be updated to.
             */
            registrationStatus: z.nativeEnum(kRegistrationStatus),

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

export type UpdateApplicationDefinition = ApiDefinition<typeof kUpdateApplicationDefinition>;

type Request = ApiRequest<typeof kUpdateApplicationDefinition>;
type Response = ApiResponse<typeof kUpdateApplicationDefinition>;

/**
 * API that allows an application to be updated.
 */
export async function updateApplication(request: Request, props: ActionProps): Promise<Response> {
    if (!props.user)
        forbidden();

    const requestContext = await db.selectFrom(tEventsTeams)
        .innerJoin(tEvents)
            .on(tEvents.eventId.equals(tEventsTeams.eventId))
            .and(tEvents.eventSlug.equals(request.event))
        .innerJoin(tTeams)
            .on(tTeams.teamId.equals(tEventsTeams.teamId))
            .and(tTeams.teamSlug.equals(request.team))
        .innerJoin(tUsers)
            .on(tUsers.userId.equals(request.userId))
        .where(tEventsTeams.enableTeam.equals(/* true= */ 1))
        .select({
            event: tEvents.eventShortName,
            eventId: tEvents.eventId,
            teamId: tTeams.teamId,
            username: tUsers.username,
        })
        .executeSelectNoneOrOne();

    if (!requestContext || !requestContext.username)
        notFound();

    const { eventId, teamId, username } = requestContext;

    let affectedRows: number = 0;
    let skipLog: boolean = false;

    //----------------------------------------------------------------------------------------------
    // Update type (1): Application data
    //----------------------------------------------------------------------------------------------

    if (request.data) {
        executeAccessCheck(props.authenticationContext, {
            check: 'admin-event',
            event: request.event,
            permission: {
                permission: 'event.volunteers.information',
                operation: 'update',
                scope: {
                    event: request.event,
                    team: request.team,
                },
            },
        });

        affectedRows = await db.update(tUsersEvents)
            .set({
                shirtFit: request.data.tshirtFit as any,
                shirtSize: request.data.tshirtSize as any,
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
            permission: {
                permission: 'event.volunteers.overrides',
                scope: {
                    event: request.event,
                    team: request.team,
                },
            },
        });

        affectedRows = await db.update(tUsersEvents)
            .set({
                availabilityEventLimit: request.metadata.availabilityEventLimit,
                hotelEligible: request.metadata.hotelEligible,
                trainingEligible: request.metadata.trainingEligible,
                registrationDate: request.metadata.registrationDate,
            })
            .where(tUsersEvents.userId.equals(request.userId))
                .and(tUsersEvents.eventId.equals(eventId))
                .and(tUsersEvents.teamId.equals(teamId))
            .executeUpdate(/* min= */ 0, /* max= */ 1);
    }

    //----------------------------------------------------------------------------------------------
    // Update type (3): Application notes
    //----------------------------------------------------------------------------------------------

    if (typeof request.notes === 'string') {
        executeAccessCheck(props.authenticationContext, {
            check: 'admin-event',
            event: request.event,
        });

        affectedRows = await db.update(tUsersEvents)
            .set({
                registrationNotes: !!request.notes.length ? request.notes : undefined,
            })
            .where(tUsersEvents.userId.equals(request.userId))
                .and(tUsersEvents.eventId.equals(eventId))
                .and(tUsersEvents.teamId.equals(teamId))
            .executeUpdate();

        skipLog = true;

        RecordLog({
            type: kLogType.EventVolunteerNotes,
            severity: kLogSeverity.Info,
            sourceUser: props.user,
            targetUser: request.userId,
            data: {
                event: requestContext.event,
                notes: request.notes,
            },
        });
    }

    //----------------------------------------------------------------------------------------------
    // Update type (4): Application status
    //----------------------------------------------------------------------------------------------

    if (request.status) {
        switch (request.status.registrationStatus) {
            // Accept and approve applications; cancel and re-instate volunteers:
            case kRegistrationStatus.Accepted:
            case kRegistrationStatus.Cancelled:
            case kRegistrationStatus.Rejected:
                executeAccessCheck(props.authenticationContext, {
                    check: 'admin-event',
                    event: request.event,
                    permission: {
                        permission: 'event.applications',
                        operation: 'update',
                        scope: {
                            event: request.event,
                            team: request.team,
                        },
                    },
                });

                break;

            // Reconsider previously rejected applications:
            case kRegistrationStatus.Registered:
                executeAccessCheck(props.authenticationContext, {
                    check: 'admin-event',
                    event: request.event,
                    permission: {
                        permission: 'event.applications',
                        operation: 'create',
                        scope: {
                            event: request.event,
                            team: request.team,
                        },
                    },
                });

                break;
        }

        if (request.status.registrationStatus !== kRegistrationStatus.Registered) {
            const { subject, message } = request.status;
            if (!subject || !message) {
                if (!props.access.can('volunteer.silent'))
                    forbidden();

            } else {
                await SendEmailTask.Schedule({
                    sender: `${props.user.firstName} ${props.user.lastName} (AnimeCon)`,
                    message: {
                        to: username,
                        subject: subject,
                        markdown: message,
                    },
                    attribution: {
                        sourceUserId: props.user.userId,
                        targetUserId: request.userId,
                    },
                });
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

        RecordLog({
            type: kLogType.AdminUpdateTeamVolunteerStatus,
            severity: kLogSeverity.Warning,
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

    if (!!affectedRows && !skipLog) {
        RecordLog({
            type: kLogType.AdminUpdateTeamVolunteer,
            severity: kLogSeverity.Info,
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
