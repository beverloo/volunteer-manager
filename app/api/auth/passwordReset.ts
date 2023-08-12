// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import type { ActionProps } from '../Action';
import { LogType, Log } from '@lib/Log';

import { authenticateUserFromSession } from '@lib/auth/Authentication';
import { unsealPasswordResetRequest } from '@lib/auth/PasswordReset';
import { writeSealedSessionCookie } from '@lib/auth/Session';

/**
 * Interface definition for the PasswordReset API, exposed through /api/auth/password-reset.
 */
export const kPasswordResetDefinition = z.object({
    request: z.object({
        /**
         * The new password that the user would like to store. Must already be sha256 hashed.
         */
        password: z.string().length(64),

        /**
         * The sealed password reset request that the server should consider.
         */
        request: z.string(),
    }),

    response: z.strictObject({
        /**
         * Whether the new password has been stored.
         */
        success: z.boolean(),
    }),
});

export type PasswordResetDefinition = z.infer<typeof kPasswordResetDefinition>;

type Request = PasswordResetDefinition['request'];
type Response = PasswordResetDefinition['response'];

/**
 * This API enables the client to reset their password after having lost it. The `request` includes
 * both the (hashed) new password, as well as the password reset request to validate that it's
 * really that user who wishes to reset their password.
 */
export async function passwordReset(request: Request, props: ActionProps): Promise<Response> {
    const passwordResetRequest = await unsealPasswordResetRequest(request.request);
    if (passwordResetRequest) {
        const user = await authenticateUserFromSession(passwordResetRequest);

        if (user) {
            await user.updatePassword(request.password, /* incrementSessionToken= */ true);
            await writeSealedSessionCookie(
                { id: user.userId, token: user.sessionToken }, props.responseHeaders);

            Log({
                type: LogType.AccountPasswordReset,
                sourceUser: user,
                data: { ip: props.ip },
            });

            return { success: true };
        }
    }

    return { success: false };
}
