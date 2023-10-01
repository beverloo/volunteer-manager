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
export const kUpdateAdviceDefinition = z.object({
    request: z.object({
        /**
         * Unique ID of the piece of advice that should be updated. Included in the URL.
         */
        id: z.coerce.number(),

        /**
         * New advice that it should be updated to.
         */
        advice: z.string(),
    }),
    response: z.strictObject({
        /**
         * Whether the advice was successfully updated.
         */
        success: z.boolean(),
    }),
});

export type UpdateAdviceDefinition = z.infer<typeof kUpdateAdviceDefinition>;

type Request = UpdateAdviceDefinition['request'];
type Response = UpdateAdviceDefinition['response'];

/**
 * API to update existing advice on behalf of Del a Rie Advies.
 */
export async function updateAdvice(request: Request, props: ActionProps): Promise<Response> {
    executeAccessCheck(props.authenticationContext, {
        check: 'admin',
        privilege: Privilege.SystemNardoAccess,
    });

    const affectedRows = await db.update(tNardo)
        .set({
            nardoAdvice: request.advice,
        })
        .where(tNardo.nardoId.equals(request.id))
            .and(tNardo.nardoVisible.equals(/* true= */ 1))
        .executeUpdate(/* min= */ 0, /* max= */ 1);

    await Log({
        type: LogType.AdminNardoMutation,
        sourceUser: props.user!.userId,
        data: {
            mutation: 'Updated',

            nardoId: request.id,
            nardoAdvice: request.advice,
        },
    });

    return { success: !!affectedRows };
}
