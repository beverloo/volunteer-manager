// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import type { ActionProps } from '../Action';
import { authenticateUserFromPassword } from '@lib/auth/Authentication';
import { sealPasswordResetRequest } from '@lib/auth/PasswordReset';
import { writeSealedSessionCookie } from '@lib/auth/Session';

/**
 * Interface definition for the SignInPassword API, exposed through /api/auth/sign-in-password.
 */
export const kSignInPasswordDefinition = z.object({
    request: z.object({
        /**
         * The username whom is attempting to sign in to their account.
         */
        username: z.string().email(),

        /**
         * The password associated with that account, SHA256 hashed.
         */
        password: z.string().length(64),
    }),

    response: z.strictObject({
        /**
         * Whether the sign in attempt was successful.
         */
        success: z.boolean(),

        /**
         * Token that signals that a password update must take place. This will usually be issued
         * when the user signed in with an access token as opposed to a password.
         */
        requiredPasswordUpdateToken: z.string().optional(),
    }),
});

export type SignInPasswordDefinition = z.infer<typeof kSignInPasswordDefinition>;

type Request = SignInPasswordDefinition['request'];
type Response = SignInPasswordDefinition['response'];

/**
 * API that allows the user to sign in to their account with a password. The password shared with
 * the server must be SHA-256 hashed already. A cookie will be set when the password is correct.
 */
export async function signInPassword(request: Request, props: ActionProps): Promise<Response> {
    const [ authType, user ] =
        await authenticateUserFromPassword(request.username, request.password);

    switch (authType) {
        case 'code': {  // one-time access code
            return {
                success: true,
                requiredPasswordUpdateToken: await sealPasswordResetRequest({
                    id: user.userId,
                    token: user.sessionToken,
                }),
            };
        }

        case 'password': {  // stored password
            await writeSealedSessionCookie(
                { id: user.userId, token: user.sessionToken }, props.responseHeaders);

            return { success: true };
        }
    }

    return { success: false };
}