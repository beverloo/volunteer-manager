// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { forbidden, notFound, unauthorized } from 'next/navigation';
import { z } from 'zod';

import type { ActionProps } from '../../Action';
import type { ApiDefinition, ApiRequest, ApiResponse } from '../../Types';
import { LogSeverity, LogType, Log } from '@lib/Log';
import { RegistrationStatus, RetentionStatus } from '@lib/database/Types';
import { SendEmailTask } from '@lib/scheduler/tasks/SendEmailTask';
import { Temporal, formatDate } from '@lib/Temporal';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import { getEventBySlug } from '@lib/EventLoader';

import db, { tEvents, tRetention, tTeams, tUsersEvents, tUsers } from '@lib/database';

/**
 * Interface definition for an API to remind a volunteer to participate in an event.
 */
export const kRemindParticipationDefinition = z.object({
    request: z.object({
        /**
         * Event for which the volunteer should be reminded to participate.
         */
        event: z.string(),

        /**
         * Team for which the volunteer should be reminded to participate.
         */
        team: z.string(),

        /**
         * Unique ID of the user to whom the message should be send.
         */
        userId: z.number(),

        /**
         * The e-mail message that should be send.
         */
        email: z.object({
            /**
             * Subject of the e-mail message.
             */
            subject: z.string(),

            /**
             * Body of the e-mail message.
             */
            message: z.string(),

        }).optional(),

        /**
         * The message that should be send over WhatsApp.
         */
        whatsApp: z.object({
            // TODO...
        }).optional(),

    }),
    response: z.strictObject({
        /**
         * Whether the operation could be completed successfully.
         */
        success: z.boolean(),

        /**
         * Optional error message explaining what went wrong.
         */
        error: z.string().optional(),
    }),
});

export type RemindParticipationDefinition = ApiDefinition<typeof kRemindParticipationDefinition>;

type Request = ApiRequest<typeof kRemindParticipationDefinition>;
type Response = ApiResponse<typeof kRemindParticipationDefinition>;

/**
 * API that allows an automated message to remind a volunteer to participate in an event.
 */
export async function remindParticipation(request: Request, props: ActionProps): Promise<Response> {
    executeAccessCheck(props.authenticationContext, {
        check: 'admin-event',
        event: request.event,

        permission: {
            permission: 'event.retention',
            scope: {
                event: request.event,
                team: request.team,
            },
        },
    });

    if (!props.user)
        unauthorized();

    const event = await getEventBySlug(request.event);
    if (!event)
        notFound();  // invalid event was given

    const teamId = await db.selectFrom(tTeams)
        .selectOneColumn(tTeams.teamId)
        .where(tTeams.teamSlug.equals(request.team))
        .executeSelectNoneOrOne();

    if (!teamId)
        notFound();  // invalid team was given

    const retentionJoin = tRetention.forUseInLeftJoin();
    const usersEventsJoin = tUsersEvents.forUseInLeftJoinAs('curEvent');

    const dbInstance = db;
    const volunteer = await dbInstance.selectFrom(tUsersEvents)
        .innerJoin(tEvents)
            .on(tEvents.eventId.equals(tUsersEvents.eventId))
        .innerJoin(tUsers)
            .on(tUsers.userId.equals(tUsersEvents.userId))
        .leftJoin(usersEventsJoin)
            .on(usersEventsJoin.eventId.equals(event.eventId))
            .and(usersEventsJoin.userId.equals(tUsersEvents.userId))
        .leftJoin(retentionJoin)
            .on(retentionJoin.userId.equals(tUsersEvents.userId))
            .and(retentionJoin.eventId.equals(event.eventId))
            .and(retentionJoin.teamId.equals(tUsersEvents.teamId))
        .where(tUsersEvents.userId.equals(request.userId))
            .and(tUsersEvents.teamId.equals(teamId))
            .and(tUsersEvents.registrationStatus.in(
                [ RegistrationStatus.Accepted, RegistrationStatus.Cancelled ]))
            .and(usersEventsJoin.registrationStatus.isNull())
            .and(retentionJoin.retentionStatus.isNull())
        .select({
            emailAddress: tUsers.username,
            phoneNumber: tUsers.phoneNumber,
        })
        .groupBy(tUsersEvents.userId, usersEventsJoin.eventId)
        .executeSelectNoneOrOne();

    if (!volunteer)
        forbidden();  // the volunteer is not eligible for being reminded

    if (!!request.email && !!request.whatsApp)
        return { success: false, error: 'You can only reach out using e-mail or WhatsApp…' };

    const noteDate = formatDate(Temporal.Now.instant(), 'MMMM Do');
    const noteMedium = !!request.email ? 'Sent an e-mail'
                                       : 'Sent a WhatsApp message';

    const affectedRows = await db.insertInto(tRetention)
        .set({
            userId: request.userId,
            eventId: event.eventId,
            teamId: teamId,
            retentionStatus: RetentionStatus.Contacting,
            retentionAssigneeId: props.user.userId,
            retentionNotes: `${noteMedium} (${noteDate})`,
        })
        .onConflictDoUpdateSet({
            retentionStatus: RetentionStatus.Contacting,
            retentionAssigneeId: props.user.userId,
            retentionNotes: `${noteMedium} (${noteDate})`,
        })
        .executeInsert();

    if (!affectedRows)
        return { success: false, error: 'Unable to assign this volunteer to you…' };

    if (!!request.email) {
        if (!volunteer.emailAddress)
            return { success: false, error: 'We don\'t have their e-mail address on file…' };

        await SendEmailTask.Schedule({
            sender: `${props.user.firstName} ${props.user.lastName} (AnimeCon)`,
            message: {
                to: volunteer.emailAddress,
                subject: request.email.subject,
                markdown: request.email.message,
            },
            attribution: {
                sourceUserId: props.user.userId,
                targetUserId: request.userId,
            },
        });
    } else if (!!request.whatsApp) {
        return { success: false, error: 'Not yet implemented' };
    }

    await Log({
        type: LogType.AdminEventRetentionUpdate,
        severity: LogSeverity.Info,
        sourceUser: props.user,
        targetUser: request.userId,
        data: {
            event: event.shortName,
        }
    });

    return { success: true };
}
