// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import type { ActionProps } from '../Action';
import { authenticateUserFromSession } from '@lib/auth/Authentication';
import { unsealPasswordResetRequest } from '@lib/auth/PasswordReset';
import { writeSealedSessionCookie } from '@lib/auth/Session';

/**
 * Interface definition for the SignInPasswordUpdate API, exposed through
 * /api/auth/sign-in-password-update.
 */
export const kSignInPasswordUpdateDefinition = z.object({
    request: z.object({
        /**
         * The username whom is attempting to sign in to their account.
         */
        username: z.string().email(),

        /**
         * The password that they would like to store for their account, SHA256 hashed.
         */
        password: z.string().length(64),

        /**
         * The password reset token that validates this update request.
         */
        passwordResetRequest: z.string(),
    }),

    response: z.strictObject({
        /**
         * Whether the sign in attempt was successful following a password update.
         */
        success: z.boolean(),
    }),
});

export type SignInPasswordUpdateDefinition = z.infer<typeof kSignInPasswordUpdateDefinition>;

type Request = SignInPasswordUpdateDefinition['request'];
type Response = SignInPasswordUpdateDefinition['response'];

/**
 * API that allows the user to sign in to their account while updating their password. We use this
 * flow to quickly give access codes to volunteers who forgot their password during the convention.
 */
export async function signInPasswordUpdate(request: Request, props: ActionProps)
    : Promise<Response>
{
    const passwordResetRequest = await unsealPasswordResetRequest(request.passwordResetRequest);
    if (passwordResetRequest) {
        const user = await authenticateUserFromSession(passwordResetRequest);
        if (user) {
            await user.updatePassword(request.password, /* incrementSessionToken= */ true);
            await writeSealedSessionCookie(
                { id: user.userId, token: user.sessionToken }, props.responseHeaders);

            return { success: true };
        }
    }

    return { success: false };
}
