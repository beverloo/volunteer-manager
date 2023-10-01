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
export const kDeleteAdviceDefinition = z.object({
    request: z.object({
        /**
         * ID of the piece of advice that should be deleted. Included in the URL.
         */
        id: z.coerce.number(),
    }),
    response: z.strictObject({
        /**
         * Whether the piece of advice was successfully deleted.
         */
        success: z.boolean(),
    }),
});

export type DeleteAdviceDefinition = z.infer<typeof kDeleteAdviceDefinition>;

type Request = DeleteAdviceDefinition['request'];
type Response = DeleteAdviceDefinition['response'];

/**
 * API to delete existing advice on behalf of Del a Rie Advies.
 */
export async function deleteAdvice(request: Request, props: ActionProps): Promise<Response> {
    executeAccessCheck(props.authenticationContext, {
        check: 'admin',
        privilege: Privilege.SystemNardoAccess,
    });

    const affectedRows = await db.update(tNardo)
        .set({
            nardoVisible: /* false= */ 0,
        })
        .where(tNardo.nardoId.equals(request.id))
            .and(tNardo.nardoVisible.equals(/* true= */ 1))
        .executeUpdate(/* min= */ 0, /* max= */ 1);

    await Log({
        type: LogType.AdminNardoMutation,
        sourceUser: props.user!.userId,
        data: {
            mutation: 'Deleted',
        },
    });

    return { success: !!affectedRows };
}
