// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod/v4';

import type { ActionProps } from '../Action';
import type { ApiDefinition, ApiRequest, ApiResponse } from '../Types';
import { RecordLog, kLogType } from '@lib/Log';
import { authenticateUser, getUserSessionToken } from '@lib/auth/Authentication';
import { unsealPasswordResetRequest } from '@lib/auth/PasswordReset';
import { updateUserPassword } from './passwordReset';
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

export type SignInPasswordUpdateDefinition = ApiDefinition<typeof kSignInPasswordUpdateDefinition>;

type Request = ApiRequest<typeof kSignInPasswordUpdateDefinition>;
type Response = ApiResponse<typeof kSignInPasswordUpdateDefinition>;

/**
 * API that allows the user to sign in to their account while updating their password. We use this
 * flow to quickly give access codes to volunteers who forgot their password during the convention.
 */
export async function signInPasswordUpdate(request: Request, props: ActionProps)
    : Promise<Response>
{
    const passwordResetRequest = await unsealPasswordResetRequest(request.passwordResetRequest);
    if (passwordResetRequest) {
        const { user } = await authenticateUser({ type: 'session', ...passwordResetRequest });
        if (user) {
            await updateUserPassword(user.id, request.password, /* incrementSession= */ true);

            const sessionToken = await getUserSessionToken(user);
            if (!sessionToken)
                return { success: false };

            await writeSealedSessionCookie(
                { id: user.id, token: sessionToken }, props.responseHeaders);

            RecordLog({
                type: kLogType.AccountPasswordUpdate,
                sourceUser: user,
                data: { ip: props.ip },
            });

            return { success: true };
        }
    }

    return { success: false };
}
