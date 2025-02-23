// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import type { ActionProps } from '../Action';
import type { ApiDefinition, ApiRequest, ApiResponse } from '../Types';
import { RecordLog, kLogType } from '@lib/Log';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import db, { tUsers } from '@lib/database';

/**
 * Interface definition for the Activation API, exposed through /api/admin/update-activation. Only
 * people with universal volunteer access can use this API.
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

export type UpdateActivationDefinition = ApiDefinition<typeof kUpdateActivationDefinition>;

type Request = ApiRequest<typeof kUpdateActivationDefinition>;
type Response = ApiResponse<typeof kUpdateActivationDefinition>;

/**
 * API that allows the activation status of a particular account to be updated. Only users with
 * universal volunteer access can use this API, and they cannot use it on their own account.
 */
export async function updateActivation(request: Request, props: ActionProps): Promise<Response> {
    executeAccessCheck(props.authenticationContext, {
        check: 'admin',
        permission: 'volunteer.account',
    });

    const affectedRows = await db.update(tUsers)
        .set({ activated: request.activated ? 1 : 0 })
        .where(tUsers.userId.equals(request.userId))
        .executeUpdate(/* min= */ 0, /* max= */ 1);

    if (!!affectedRows) {
        RecordLog({
            type: kLogType.AdminUpdateActivation,
            sourceUser: props.user,
            targetUser: request.userId,
            data: {
                activated: request.activated,
                ip: props.ip,
            },
        });
    }

    return { success: !!affectedRows };
}
