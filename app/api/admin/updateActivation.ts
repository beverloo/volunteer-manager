// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { type ActionProps, noAccess } from '../Action';
import { LogType, Log } from '@lib/Log';
import { Privilege, can } from '@lib/auth/Privileges';
import { sql } from '@lib/database';

/**
 * Interface definition for the Activation API, exposed through /api/admin/update-activation. Only
 * administrators have the ability to call this API.
 */
export const kUpdateActivationDefinition = z.object({
    request: z.object({
        /**
         * ID of the user for whom activation status is being updated.
         */
        userId: z.number(),

        /**
         * Whether their account should be activated.
         */
        activated: z.boolean(),
    }),
    response: z.strictObject({
        /**
         * Whether the activation status was updated successfully.
         */
        success: z.boolean(),
    }),
});

export type UpdateActivationDefinition = z.infer<typeof kUpdateActivationDefinition>;

type Request = UpdateActivationDefinition['request'];
type Response = UpdateActivationDefinition['response'];

/**
 * API that allows the activation status of a particular account to be updated. Only administrators
 * have the ability to call this API. Disallow administrators from breaking their own account.
 */
export async function updateActivation(request: Request, props: ActionProps): Promise<Response> {
    if (!can(props.user, Privilege.Administrator) || request.userId === props.user?.userId)
        noAccess();

    const result = await sql`
        UPDATE
            users
        SET
            users.activated = ${request.activated}
        WHERE
            users.user_id = ${request.userId}
        LIMIT
            1`;

    if (result.ok && result.affectedRows > 0) {
        Log({
            type: LogType.AdminUpdateActivation,
            sourceUser: props.user,
            targetUser: request.userId,
            data: {
                activated: request.activated,
                ip: props.ip,
            },
        });
    }

    return { success: result.ok };
}
