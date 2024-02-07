// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';
import { z } from 'zod';

import type { ActionProps } from '../../Action';
import type { ApiDefinition, ApiRequest, ApiResponse } from '../../Types';
import { Privilege } from '@lib/auth/Privileges';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import db, { tOutbox } from '@lib/database';

/**
 * Interface definition for the Outbox API, exposed through /api/admin/outbox.
 */
export const kGetOutboxDefinition = z.object({
    request: z.object({
        /**
         * Unique ID of the message that should be retrieved.
         */
        id: z.coerce.number(),
    }),
    response: z.strictObject({
        /**
         * Date on which the message was send, in UTC. Formatted in a Temporal ZonedDateTime
         * compatible formatting.
         */
        date: z.string(),

        /**
         * Name under which the message had been send.
         */
        from: z.string(),

        /**
         * User ID of the person who sent the message, if any.
         */
        fromUserId: z.number().optional(),

        /**
         * E-mail address of the recipient of the message.
         */
        to: z.string(),

        /**
         * User ID of the person who received the message, if any.
         */
        toUserId: z.number().optional(),

        /**
         * E-mail addresses to whom the message was CC'd.
         */
        cc: z.string().optional(),

        /**
         * E-mail addresses to whom the message was BCC'd.
         */
        bcc: z.string().optional(),

        /**
         * Subject line of the message, as it was send.
         */
        subject: z.string(),

        /**
         * Extra headers that were included with the message, if any.
         */
        headers: z.string().optional(),

        /**
         * Text content of the message. May be empty.
         */
        text: z.string(),

        /**
         * HTML content of the message. May be empty.
         */
        html: z.string(),

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
    }),
});

export type GetOutboxDefinition = ApiDefinition<typeof kGetOutboxDefinition>;

type Request = ApiRequest<typeof kGetOutboxDefinition>;
type Response = ApiResponse<typeof kGetOutboxDefinition>;

/**
 * API that allows volunteers with outbox access to consult a particular message. This endpoint
 * allows information about a specific message to be retrieved.
 */
export async function getOutbox(request: Request, props: ActionProps): Promise<Response> {
    executeAccessCheck(props.authenticationContext, {
        check: 'admin',
        privilege: Privilege.SystemOutboxAccess,
    });

    const dbInstance = db;
    const message = await dbInstance.selectFrom(tOutbox)
        .select({
            // Message info:
            date: tOutbox.outboxTimestampString,

            from: tOutbox.outboxSender,
            fromUserId: tOutbox.outboxSenderUserId,
            to: tOutbox.outboxTo,
            toUserId: tOutbox.outboxToUserId,
            cc: tOutbox.outboxCc,
            bcc: tOutbox.outboxBcc,
            subject: tOutbox.outboxSubject,
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
        .where(tOutbox.outboxId.equals(request.id))
        .executeSelectNoneOrOne();

    if (!message)
        notFound();

    return message;
}
