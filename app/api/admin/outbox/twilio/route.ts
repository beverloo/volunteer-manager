// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { type DataTableEndpoints, createDataTableApi } from '../../../createDataTableApi';
import { Privilege } from '@lib/auth/Privileges';
import { TwilioOutboxType } from '@lib/database/Types';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import db, { tOutboxTwilio, tUsers } from '@lib/database';

/**
 * Row model for a Twilio that was sent using the Volunteer Manager.
 */
const kOutboxTwilioRowModel = z.object({
    /**
     * Unique ID of this message.
     */
    id: z.number(),

    /**
     * Date and time at which the message was sent, in UTC.
     */
    date: z.string(),

    /**
     * Name and, if available, user ID of the person who sent the message. The name may be missing
     * when we haven't received acknowledgement from Twilio yet.
     */
    sender: z.object({
        name: z.string().optional(),
        userId: z.number().optional(),
    }).optional(),

    /**
     * Name and user ID of the person who received the message.
     */
    recipient: z.object({
        name: z.string(),
        userId: z.number(),
    }),

    /**
     * The message that was sent to the recipient.
     */
    message: z.string(),

    /**
     * Whether the message was successfully delivered.
     */
    delivered: z.boolean(),
});

/**
 * Twilio powers several messaging channels, where the appropriate one is communicated using the
 * Data Table context.
 */
const kOutboxTwilioContext = z.object({
    context: z.object({
        /**
         * Type of message that should be considered for this API.
         */
        type: z.nativeEnum(TwilioOutboxType),
    }),
});

/**
 * Export type definitions so that the API can be used in `callApi()`.
 */
export type OutboxTwilioEndpoints =
    DataTableEndpoints<typeof kOutboxTwilioRowModel, typeof kOutboxTwilioContext>;

/**
 * Export type definition for the API's Row Model.
 */
export type OutboxTwilioRowModel = z.infer<typeof kOutboxTwilioRowModel>;

/**
 * This is implemented as a regular DataTable API. The following endpoints are provided by this
 * implementation:
 *
 *     GET /api/admin/twilio
 */
export const { GET } = createDataTableApi(kOutboxTwilioRowModel, kOutboxTwilioContext, {
    async accessCheck(request, action, props) {
        executeAccessCheck(props.authenticationContext, {
            check: 'admin',
            permission: 'system.internals.outbox',
        });
    },

    async list({ context, pagination, sort }) {
        let sortField: 'id' | 'date' | 'sender.name' | 'recipient.name' | 'message' | 'delivered';
        switch (sort?.field) {
            case 'id':
            case 'date':
            case 'message':
            case 'delivered':
                sortField = sort.field;
                break;

            case 'sender':
                sortField = 'sender.name';
                break;

            case 'recipient':
                sortField = 'recipient.name';
                break;

            default:
                sortField = 'date';
                break;
        }

        const dbInstance = db;
        const messages = await dbInstance.selectFrom(tOutboxTwilio)
            .innerJoin(tUsers)
                .on(tUsers.userId.equals(tOutboxTwilio.outboxRecipientUserId))
            .where(tOutboxTwilio.outboxType.equals(context.type))
            .select({
                id: tOutboxTwilio.outboxTwilioId,
                date: dbInstance.dateTimeAsString(tOutboxTwilio.outboxTimestamp),
                sender: {
                    name: tOutboxTwilio.outboxSender,
                    userId: tOutboxTwilio.outboxSenderUserId,
                },
                recipient: {
                    name: tUsers.name,
                    userId: tOutboxTwilio.outboxRecipientUserId,
                },
                message: tOutboxTwilio.outboxMessage,
                delivered: tOutboxTwilio.outboxResultStatus.in([ 'delivered', 'read', 'sent' ])
                    .valueWhenNull(dbInstance.false()),
            })
            .orderBy(sortField, sort?.sort ?? 'desc')
            .limitIfValue(pagination?.pageSize)
                .offsetIfValue(pagination ? pagination.page * pagination.pageSize
                                          : undefined)
            .executeSelectPage();

        return {
            success: true,
            rowCount: messages.count,
            rows: messages.data
        };
    },
});

export const dynamic = 'force-dynamic';
