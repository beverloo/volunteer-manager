// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import type { ActionProps } from '../../Action';
import { Privilege } from '@lib/auth/Privileges';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import db, { tOutbox } from '@lib/database';

/**
 * Interface definition for the Outbox API, exposed through /api/admin/outbox.
 */
export const kListOutboxDefinition = z.object({
    request: z.object({
        /**
         * The page the user is currently navigating.
         */
        page: z.number(),

        /**
         * The number of entries that should be displayed on a single page.
         */
        pageSize: z.number(),

        /**
         * The way in which the resulting data should be sorted. Multiple sorting keys can be
         * defined, as one might want to sort based on user, then based on time.
         */
        sortModel: z.array(z.object({
            /**
             * The field on which a sort should be applied.
             */
            field: z.enum([ 'date', 'from', 'to', 'subject', 'delivered' ]),

            /**
             * The direction in which the sort should be applied, if any.
             */
            sort: z.enum([ 'asc', 'desc' ]).nullable().optional(),
        })),

    }),
    response: z.strictObject({
        /**
         * The total number of outbox entries that were found given the input constraints.
         */
        rowCount: z.number(),

        /**
         * The rows applicable to the current page of the input constraints.
         */
        rows: z.array(z.strictObject({
            /**
             * Unique ID of this message. No need to show this to the user.
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
        })),
    }),
});

export type ListOutboxDefinition = z.infer<typeof kListOutboxDefinition>;

type Request = ListOutboxDefinition['request'];
type Response = ListOutboxDefinition['response'];

/**
 * Normalizes the sort model based on the request's input, to something that the database is able to
 * deal with. The sort model will be applied in the query.
 */
function normalizeSortModel(sortModel?: Request['sortModel']): string {
    const sortItems: string[] = [];
    for (const { field, sort } of sortModel ?? [ { field: 'date', sort: 'desc' }]) {
        let column: string;

        switch (field) {
            case 'date':
            case 'from':
            case 'to':
            case 'subject':
            case 'delivered':
                column = field;
                break;

            default:
                throw new Error(`Unrecognised field: ${field}`);
        }

        let order: string;
        switch (sort) {
            case 'asc':
            case 'desc':
            case undefined:
                order = sort ?? 'asc';
                break;

            case null:
                order = 'asc nulls last';
                break;

            default:
                throw new Error(`Unrecognised sort order: ${sort}`);
        }

        sortItems.push(`${column} ${order}`);
    }

    if (!sortItems.length)
        return 'date asc';

    return sortItems.join(', ');
}

/**
 * API that allows volunteers with outbox access to consult the messages sent by the Volunteer
 * Manager. This endpoint allows retrieval of a paginated list of all messages.
 */
export async function listOutbox(request: Request, props: ActionProps): Promise<Response> {
    executeAccessCheck(props.authenticationContext, {
        check: 'admin',
        privilege: Privilege.SystemOutboxAccess,
    });

    const dbInstance = db;
    const result = await dbInstance.selectFrom(tOutbox)
        .select({
            id: tOutbox.outboxId,
            date: tOutbox.outboxTimestampString,
            from: tOutbox.outboxSender,
            fromUserId: tOutbox.outboxSenderUserId,
            to: tOutbox.outboxTo,
            toUserId: tOutbox.outboxToUserId,
            subject: tOutbox.outboxSubject,
            delivered: tOutbox.outboxResultAccepted.length().greaterThan(0).valueWhenNull(false),
        })
        .orderByFromString(normalizeSortModel(request.sortModel))
        .limit(request.pageSize).offset(request.page * request.pageSize)
        .executeSelectPage();

    return {
        rowCount: result.count,
        rows: result.data,
    };
}
