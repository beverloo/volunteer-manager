// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { type DataTableEndpoints, createDataTableApi } from '../../../createDataTableApi';
import { Privilege } from '@lib/auth/Privileges';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import db, { tOutbox } from '@lib/database';

/**
 * Row model for an e-mail that was sent using the Volunteer Manager.
 */
const kOutboxRowModel = z.object({
    /**
     * Unique ID of this message.
     */
    id: z.number(),

    /**
     * Date on which the message was send, in UTC. Formatted in a Temporal ZonedDateTime
     * compatible formatting.
     */
    date: z.string(),

    /**
     * Name of the person on whose behalf the e-mail was sent.
     */
    from: z.string(),

    /**
     * User ID of the sender of the message, when known.
     */
    fromUserId: z.number().optional(),

    /**
     * Recipient of the message, a user-associated e-mail address.
     */
    to: z.string(),

    /**
     * User ID of the recipient of the message, when known.
     */
    toUserId: z.number().optional(),

    /**
     * Subject of the message as it was sent to them.
     */
    subject: z.string(),

    /**
     * Whether the message was accepted by the receiving server.
     */
    delivered: z.boolean(),

    // ---------------------------------------------------------------------------------------------
    // Advanced fields, only included when requesting a singular message:
    // ---------------------------------------------------------------------------------------------

    /**
     * E-mail addresses to whom the message was CC'd.
     */
    cc: z.string().optional(),

    /**
     * E-mail addresses to whom the message was BCC'd.
     */
    bcc: z.string().optional(),

    /**
     * Extra headers that were included with the message, if any.
     */
    headers: z.string().optional(),

    /**
     * Text content of the message. May be empty.
     */
    text: z.string().optional(),

    /**
     * HTML content of the message. May be empty.
     */
    html: z.string().optional(),

    // -----------------------------------------------------------------------------------------
    // Log messages providing detailed information about the message
    // -----------------------------------------------------------------------------------------

    /**
     * Log messages that were recorded when the message was sent. As a JSON-encoded string.
     */
    logs: z.string().optional(),

    // -----------------------------------------------------------------------------------------
    // Exception that occurred when trying to send the message
    // -----------------------------------------------------------------------------------------

    /**
     * Name of the exception.
     */
    errorName: z.string().optional(),

    /**
     * Message of the exception.
     */
    errorMessage: z.string().optional(),

    /**
     * Stack trace of the exception.
     */
    errorStack: z.string().optional(),

    /**
     * Cause of the exception, when given.
     */
    errorCause: z.string().optional(),

    // -----------------------------------------------------------------------------------------
    // Result of sending the message across the wires
    // -----------------------------------------------------------------------------------------

    /**
     * ID of the message as it was accepted by the receiving server.
     */
    messageId: z.string().optional(),

    /**
     * E-mail addresses for whom the message was accepted, if any.
     */
    accepted: z.string().optional(),

    /**
     * E-mail addresses for whom the message was rejected, if any.
     */
    rejected: z.string().optional(),

    /**
     * E-mail addresses for whom the message is still pending, if any.
     */
    pending: z.string().optional(),

    /**
     * Response text from the underlying SMTP implementation.
     */
    response: z.string().optional(),
});

/**
 * This API does not require any context.
 */
const kOutboxContext = z.never();

/**
 * Export type definitions so that the API can be used in `callApi()`.
 */
export type OutboxEndpoints =
    DataTableEndpoints<typeof kOutboxRowModel, typeof kOutboxContext>;

/**
 * Export type definition for the API's Row Model.
 */
export type OutboxRowModel = z.infer<typeof kOutboxRowModel>;

/**
 * Export type definition for the API's context.
 */
export type OutboxContext = z.infer<typeof kOutboxContext>;

/**
 * This is implemented as a regular DataTable API. The following endpoints are provided by this
 * implementation:
 *
 *     GET /api/admin/outbox
 *     GET /api/admin/outbox/:id
 */
export const { GET } = createDataTableApi(kOutboxRowModel, kOutboxContext, {
    async accessCheck(request, action, props) {
        executeAccessCheck(props.authenticationContext, {
            check: 'admin',
            privilege: Privilege.SystemOutboxAccess,
        });
    },

    async get({ id }) {
        const row = await db.selectFrom(tOutbox)
            .select({
                // Basic fields:
                id: tOutbox.outboxId,
                date: tOutbox.outboxTimestampString,
                from: tOutbox.outboxSender,
                fromUserId: tOutbox.outboxSenderUserId,
                to: tOutbox.outboxTo,
                toUserId: tOutbox.outboxToUserId,
                subject: tOutbox.outboxSubject,
                delivered:
                    tOutbox.outboxResultAccepted.length().greaterThan(0).valueWhenNull(false),

                // Detailed fields:
                cc: tOutbox.outboxCc,
                bcc: tOutbox.outboxBcc,

                headers: tOutbox.outboxHeaders,

                // Message content:
                text: tOutbox.outboxBodyText,
                html: tOutbox.outboxBodyHtml,

                // Message logs:
                logs: tOutbox.outboxLogs,

                // Message error:
                errorName: tOutbox.outboxErrorName,
                errorMessage: tOutbox.outboxErrorMessage,
                errorStack: tOutbox.outboxErrorStack,
                errorCause: tOutbox.outboxErrorCause,

                // Message result:
                messageId: tOutbox.outboxResultMessageId,
                accepted: tOutbox.outboxResultAccepted,
                rejected: tOutbox.outboxResultRejected,
                pending: tOutbox.outboxResultPending,
                response: tOutbox.outboxResultResponse,
            })
            .where(tOutbox.outboxId.equals(id))
            .executeSelectNoneOrOne();

        if (!row)
            return { success: false, error: 'That message could not be found.' };

        return { success: true, row };
    },

    async list({ pagination, sort }) {
        const result = await db.selectFrom(tOutbox)
            .select({
                id: tOutbox.outboxId,
                date: tOutbox.outboxTimestampString,
                from: tOutbox.outboxSender,
                fromUserId: tOutbox.outboxSenderUserId,
                to: tOutbox.outboxTo,
                toUserId: tOutbox.outboxToUserId,
                subject: tOutbox.outboxSubject,
                delivered:
                    tOutbox.outboxResultAccepted.length().greaterThan(0).valueWhenNull(false),
            })
            .orderBy(sort?.field ?? 'date' as any, sort?.sort ?? 'desc')
            .limitIfValue(pagination?.pageSize)
                .offsetIfValue(pagination ? pagination.page * pagination.pageSize
                                          : undefined)
            .executeSelectPage();

        return {
            success: true,
            rowCount: result.count,
            rows: result.data,
        };
    },
});
