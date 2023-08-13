// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { type ActionProps, noAccess } from '../Action';
import { Log, LogType, LogSeverity } from '@lib/Log';
import { Privilege, can } from '@lib/auth/Privileges';
import { sql } from '@lib/database';

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
         * Privileges that should be stored for this number.
         */
        privileges: z.number(),
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
    if (!can(props.user, Privilege.Administrator))
        noAccess();

    Log({
        type: LogType.AdminUpdatePermission,
        severity: LogSeverity.Warning,
        sourceUser: props.user,
        targetUser: request.userId,
        data: {
            ip: props.ip,
            privileges: request.privileges,
        }
    });

    const result =
        await sql`
            UPDATE
                users
            SET
                users.privileges = ${request.privileges}
            WHERE
                users.user_id = ${request.userId}
            LIMIT
                1`;

    return { success: result.ok };
}
