// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { type ActionProps, noAccess } from '../Action';
import { LogType, Log } from '@lib/Log';
import { Privilege, can } from '@lib/auth/Privileges';
import { sql } from '@lib/database';

/**
 * Interface definition for the Access Code API, exposed through /api/admin/reset-access-code.
 */
export const kResetAccessCodeDefinition = z.object({
    request: z.object({
        /**
         * ID of the user for whom a new access code is being requested.
         */
        userId: z.number(),
    }),
    response: z.strictObject({
        /**
         * The access code that can now be shared with the volunteer.
         */
        accessCode: z.string().optional(),
    }),
});

export type ResetAccessCodeDefinition = z.infer<typeof kResetAccessCodeDefinition>;

type Request = ResetAccessCodeDefinition['request'];
type Response = ResetAccessCodeDefinition['response'];

/**
 * API that allows a new access code to be created for a particular volunteer. Only certain
 * volunteers have the ability to request new access codes.
 */
export async function resetAccessCode(request: Request, props: ActionProps): Promise<Response> {
    if (!can(props.user, Privilege.AccessVolunteers))
        noAccess();

    Log({
        type: LogType.AdminResetAccessCode,
        sourceUser: props.user,
        targetUser: request.userId,
        data: { ip: props.ip }
    })

    const existingResult = await sql`
        SELECT
            users_auth.auth_value
        FROM
            users_auth
        WHERE
            users_auth.user_id = ${request.userId} AND
            users_auth.auth_type = "code"`;

    if (existingResult.ok && existingResult.rows.length > 0)
        return { accessCode: existingResult.rows[0].auth_value };

    const accessCode = Math.floor(Math.random() * (9999 - 1000) + 1000);
    const newResult = await sql`
        INSERT INTO
            users_auth
            (user_id, auth_type, auth_value)
        VALUES
            (${request.userId}, "code", ${accessCode})`;

    if (newResult.ok)
        return { accessCode: '1234' };

    return { /* error condition */ };
}
