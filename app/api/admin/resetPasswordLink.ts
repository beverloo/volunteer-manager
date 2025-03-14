// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import type { ActionProps } from '../Action';
import type { ApiDefinition, ApiRequest, ApiResponse } from '../Types';
import { RecordLog, kLogSeverity, kLogType } from '@lib/Log';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import { sealPasswordResetRequest } from '@lib/auth/PasswordReset';
import db, { tUsers } from '@lib/database';

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

export type ResetPasswordLinkDefinition = ApiDefinition<typeof kResetPasswordLinkDefinition>;

type Request = ApiRequest<typeof kResetPasswordLinkDefinition>;
type Response = ApiResponse<typeof kResetPasswordLinkDefinition>;

/**
 * API that allows a reset password link to be created for a particular account. Only administrators
 * have the ability to call this API from the administration section.
 */
export async function resetPasswordLink(request: Request, props: ActionProps): Promise<Response> {
    executeAccessCheck(props.authenticationContext, {
        check: 'admin',
        permission: 'volunteer.account',
    });

    const user = await db.selectFrom(tUsers)
        .select({ sessionToken: tUsers.sessionToken })
        .where(tUsers.userId.equals(request.userId))
        .executeSelectNoneOrOne();

    if (!user)
        return { /* no link could be made available */ };

    const passwordResetRequest = await sealPasswordResetRequest({
        id: request.userId,
        token: user.sessionToken
    });

    RecordLog({
        type: kLogType.AdminResetPasswordLink,
        severity: kLogSeverity.Warning,
        sourceUser: props.user,
        targetUser: request.userId,
        data: { ip: props.ip }
    });

    const passwordResetLink =
        `https://${props.origin}/?password-reset-request=${passwordResetRequest}`;

    return { link: passwordResetLink };
}
