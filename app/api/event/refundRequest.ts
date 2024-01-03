// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import type { ActionProps } from '../Action';
import { LogSeverity, LogType, Log } from '@lib/Log';
import { Privilege, can } from '@lib/auth/Privileges';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import { getEventBySlug } from '@lib/EventLoader';
import { dayjs } from '@lib/DateTime';
import db, { tEvents, tRefunds } from '@lib/database';

/**
 * Interface definition for the Refund API, exposed through /api/event/refund-request.
 */
export const kRefundRequestDefinition = z.object({
    request: z.object({
        /**
         * Unique slug of the event in which the volunteer participated.
         */
        event: z.string(),

        /**
         * Ticket refund request that they would like to be issued. The literal "false" can be
         * passed by administrators to clear the preference instead.
         */
        request: z.literal(false).or(z.object({
            ticketNumber: z.string().optional(),
            accountIban: z.string().min(1),
            accountName: z.string().min(1),
        })),

        /**
         * Property that allows administrators to push updates on behalf of other users.
         */
        adminOverrideUserId: z.number().optional(),
    }),
    response: z.strictObject({
        /**
         * Whether the ticket refund was stored successfully.
         */
        success: z.boolean(),

        /**
         * Error message when something went wrong. Will be presented to the user.
         */
        error: z.string().optional(),
    }),
});

export type RefundRequestDefinition = z.infer<typeof kRefundRequestDefinition>;

type Request = RefundRequestDefinition['request'];
type Response = RefundRequestDefinition['response'];

/**
 * API through which volunteers can request a refund for their ticket.
 */
export async function refundRequest(request: Request, props: ActionProps): Promise<Response> {
    if (!props.user)
        return { success: false, error: 'You must be signed in to request a refund' };

    let subjectUserId = props.user.userId;
    if (!!request.adminOverrideUserId) {
        executeAccessCheck(props.authenticationContext, {
            check: 'admin-event',
            event: request.event,
            privilege: Privilege.Refunds,
        });

        subjectUserId = request.adminOverrideUserId;
    }

    const event = await getEventBySlug(request.event);
    if (!event)
        return { success: false, error: 'The event no longer exists' };

    if (!can(props.user, Privilege.Refunds)) {
        const refundAvailability = await db.selectFrom(tEvents)
            .where(tEvents.eventId.equals(event.eventId))
            .select({
                refundsStartTime: tEvents.eventRefundsStartTime,
                refundsEndTime: tEvents.eventRefundsEndTime,
            })
            .executeSelectOne();

        if (!refundAvailability.refundsStartTime || !refundAvailability.refundsEndTime)
            return { success: false, error: 'Sorry, refunds are not being accepted.' };

        const currentTime = dayjs();
        if (currentTime.isBefore(refundAvailability.refundsStartTime, 'day'))
            return { success: false, error: 'Sorry, refunds are not being accepted yet.' };
        if (currentTime.isAfter(refundAvailability.refundsEndTime, 'day'))
            return { success: false, error: 'Sorry, refunds are not being accepted anymore.' };
    }

    // Case (0): The administrator might want to clear the refund request.
    if (!request.request) {
        if (!request.adminOverrideUserId)
            return { success: false, error: 'Your request can only be updated' };

        const affectedRows = await db.deleteFrom(tRefunds)
            .where(tRefunds.userId.equals(subjectUserId))
                .and(tRefunds.eventId.equals(event.eventId))
            .executeDelete();

        if (!!affectedRows) {
            await Log({
                type: LogType.AdminClearRefundRequest,
                severity: LogSeverity.Warning,
                sourceUser: props.user,
                targetUser: request.adminOverrideUserId,
                data: {
                    event: event.shortName,
                },
            });
        }

        return { success: !!affectedRows };
    }

    const dbInstance = db;
    const affectedRows = await dbInstance.insertInto(tRefunds)
        .set({
            userId: subjectUserId,
            eventId: event.eventId,

            refundTicketNumber: request.request.ticketNumber,
            refundAccountIban: request.request.accountIban,
            refundAccountName: request.request.accountName,
            refundRequested: dbInstance.currentDateTime2(),
        })
        .onConflictDoUpdateSet({
            refundTicketNumber: request.request.ticketNumber,
            refundAccountIban: request.request.accountIban,
            refundAccountName: request.request.accountName,
            refundRequested: dbInstance.currentDateTime2(),
        })
        .executeInsert();

    if (!affectedRows)
        return { success: false, error: 'Unable to store your request in the database' };

    if (!request.adminOverrideUserId) {
        await Log({
            type: LogType.ApplicationRefundRequest,
            severity: LogSeverity.Info,
            sourceUser: props.user,
            data: {
                event: event.shortName,
            },
        });
    } else {
        await Log({
            type: LogType.AdminUpdateRefundRequest,
            severity: LogSeverity.Warning,
            sourceUser: props.user,
            targetUser: request.adminOverrideUserId,
            data: {
                event: event.shortName,
            },
        });
    }

    return { success: true };
}
