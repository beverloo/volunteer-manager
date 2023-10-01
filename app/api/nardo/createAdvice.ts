// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import type { ActionProps } from '../Action';
import { LogType, Log } from '@lib/Log';
import { Privilege } from '@lib/auth/Privileges';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import db, { tNardo } from '@lib/database';

/**
 * Interface definition for the Nardo API, exposed through /api/nardo
 */
export const kCreateAdviceDefinition = z.object({
    request: z.object({ /* no parameters */ }),
    response: z.strictObject({
        /**
         * Unique ID of the advice that was created.
         */
        id: z.number(),

        /**
         * The advice as issued on behalf of Del a Rie Advies. Placeholder.
         */
        advice: z.string(),

        /**
         * Name and user ID of the author of this advice.
         */
        authorName: z.string(),
        authorUserId: z.number(),

        /**
         * Date and time at which the advice was created.
         */
        date: z.string(),
    }),
});

export type CreateAdviceDefinition = z.infer<typeof kCreateAdviceDefinition>;

type Request = CreateAdviceDefinition['request'];
type Response = CreateAdviceDefinition['response'];

/**
 * API to create new advice on behalf of Del a Rie Advies.
 */
export async function createAdvice(request: Request, props: ActionProps): Promise<Response> {
    executeAccessCheck(props.authenticationContext, {
        check: 'admin',
        privilege: Privilege.SystemNardoAccess,
    });

    const insertId = await db.insertInto(tNardo)
        .set({
            nardoAdvice: 'Nardo!',
            nardoAuthorId: props.user!.userId,
        })
        .returningLastInsertedId()
        .executeInsert();

    await Log({
        type: LogType.AdminNardoMutation,
        sourceUser: props.user!.userId,
        data: {
            mutation: 'Created',
        },
    });

    return {
        id: insertId,
        advice: 'Nardo!',
        authorName: `${props.user!.firstName} ${props.user!.lastName}`,
        authorUserId: props.user!.userId,
        date: (new Date).toISOString(),
    };
}
