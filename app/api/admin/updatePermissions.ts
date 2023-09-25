// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import type { ActionProps } from '../Action';
import { Log, LogType, LogSeverity } from '@lib/Log';
import { Privilege } from '@lib/auth/Privileges';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import db, { tUsers } from '@lib/database';

/**
 * Interface definition for the Volunteer API, exposed through /api/admin/update-permissions. Only
 * administrators have the ability to call this API.
 */
export const kUpdatePermissionsDefinition = z.object({
    request: z.object({
        /**
         * ID of the user for whom information is being requested.
         */
        userId: z.number(),

        /**
         * Privileges that should be stored for this number. Actually communicated as a BigInt, but
         * those are serialized as a string during transport.
         */
        privileges: z.string().regex(/^\d*$/),
    }),
    response: z.strictObject({
        /**
         * Whether the permissions were updated successfully.
         */
        success: z.boolean(),
    }),
});

export type UpdatePermissionsDefinition = z.infer<typeof kUpdatePermissionsDefinition>;

type Request = UpdatePermissionsDefinition['request'];
type Response = UpdatePermissionsDefinition['response'];

/**
 * API that allows the permissions of a particular user to be updated. Only administrators have the
 * ability to call this API from the administration section.
 */
export async function updatePermissions(request: Request, props: ActionProps): Promise<Response> {
    executeAccessCheck(props.authenticationContext, {
        check: 'admin',
        privilege: Privilege.Administrator,
    });

    await Log({
        type: LogType.AdminUpdatePermission,
        severity: LogSeverity.Warning,
        sourceUser: props.user,
        targetUser: request.userId,
        data: {
            ip: props.ip,
            privileges: request.privileges,
        }
    });

    const affectedRows = await db.update(tUsers)
        .set({ privileges: BigInt(request.privileges) })
        .where(tUsers.userId.equals(request.userId))
        .executeUpdate(/* min= */ 0, /* max= */ 1);

    return { success: !!affectedRows };
}
