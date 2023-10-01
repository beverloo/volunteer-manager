// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import type { ActionProps } from '../Action';
import { Privilege, can } from '@lib/auth/Privileges';
import db, { tNardo, tUsers } from '@lib/database';

/**
 * Interface definition for the Nardo API, exposed through /api/nardo
 */
export const kListAdviceDefinition = z.object({
    request: z.object({
        /**
         * Page of information to display. Pages default to 100 pieces of advice.
         */
        page: z.coerce.number().optional(),

        /**
         * Field on which the results should be sorted, if any.
         */
        sort: z.enum([ 'advice', 'authorName', 'date' ]).optional(),

        /**
         * Direction in which the sort should be applied.
         */
        sortDirection: z.enum([ 'asc', 'desc' ]).nullable().optional(),
    }),
    response: z.strictObject({
        /**
         * The total number of advice entries that were found given the input constraints.
         */
        rowCount: z.number(),

        /**
         * The rows applicable to the current page of the input constraints.
         */
        rows: z.array(z.strictObject({
            /**
             * Unique ID of the advice. Only exposed to administrators.
             */
            id: z.number().optional(),

            /**
             * The advice as issued on behalf of Del a Rie Advies.
             */
            advice: z.string(),

            /**
             * Name and user ID of the author of this advice. Only exposed to administrators.
             */
            authorName: z.string().optional(),
            authorUserId: z.number().optional(),

            /**
             * Date and time at which the advice was updated. Only exposed to administrators.
             */
            date: z.string().optional(),
        })),
    }),
});

export type ListAdviceDefinition = z.infer<typeof kListAdviceDefinition>;

type Request = ListAdviceDefinition['request'];
type Response = ListAdviceDefinition['response'];

/**
 * API to retrieve the list of advice on behalf of Del a Rie Advies.
 */
export async function listAdvice(request: Request, props: ActionProps): Promise<Response> {
    const comprehensiveResponse = can(props.user, Privilege.SystemNardoAccess);

    let orderBy: string | undefined = undefined;
    if (request.sort && request.sortDirection)
        orderBy = `${request.sort} ${request.sortDirection ?? 'asc'}`;

    const rawAdvice = await db.selectFrom(tNardo)
        .innerJoin(tUsers)
            .on(tUsers.userId.equals(tNardo.nardoAuthorId))
        .where(tNardo.nardoVisible.equals(/* true= */ 1))
        .select({
            id: tNardo.nardoId,
            advice: tNardo.nardoAdvice,
            authorName: tUsers.firstName.concat(' ').concat(tUsers.lastName),
            authorUserId: tUsers.userId,
            date: tNardo.nardoAuthorDate,
        })
        .orderByFromStringIfValue(orderBy)
        .limit(100).offset((request.page ?? 0) * 100)
        .executeSelectMany();

    const rows: Response['rows'] = [];
    for (const advice of rawAdvice) {
        if (!comprehensiveResponse) {
            rows.push({ advice: advice.advice });
            continue;
        }

        rows.push({ ...advice, date: advice.date.toISOString() });
    }

    return {
        rowCount: rawAdvice.length,
        rows,
    };
}
