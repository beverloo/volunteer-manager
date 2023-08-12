// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { type ActionProps, noAccess } from '../Action';
import { LogType, Log } from '@lib/Log';
import { Privilege, can } from '@lib/auth/Privileges';
import { sealPasswordResetRequest } from '@lib/auth/PasswordReset';
import { sql } from '@lib/database';

/**
 * Interface definition for the Password Link API, exposed through /api/admin/reset-password-link.
 * Only administrators have the ability to call this API.
 */
export const kResetPasswordLinkDefinition = z.object({
    request: z.object({
        /**
         * ID of the user for whom information is being requested.
         */
        userId: z.number(),
    }),
    response: z.strictObject({
        /**
         * The password reset link when it can safely been issued.
         */
        link: z.string().optional(),
    }),
});

export type ResetPasswordLinkDefinition = z.infer<typeof kResetPasswordLinkDefinition>;

type Request = ResetPasswordLinkDefinition['request'];
type Response = ResetPasswordLinkDefinition['response'];

/**
 * API that allows a reset password link to be created for a particular account. Only administrators
 * have the ability to call this API from the administration section.
 */
export async function resetPasswordLink(request: Request, props: ActionProps): Promise<Response> {
    if (!can(props.user, Privilege.Administrator))
        noAccess();

    const result =
        await sql`
            SELECT
                users.session_token
            FROM
                users
            WHERE
                users.user_id = ${request.userId}`;

    if (!result.ok || !result.rows.length)
        return { /* no link could be made available */ };

    const passwordResetRequest = await sealPasswordResetRequest({
        id: request.userId,
        token: result.rows[0].session_token,
    });

    Log({
        type: LogType.AdminResetPasswordLink,
        sourceUser: props.user,
        targetUser: request.userId,
        data: { ip: props.ip }
    });

    const passwordResetLink = `${props.origin}/?password-reset-request=${passwordResetRequest}`;
    return { link: passwordResetLink };
}
