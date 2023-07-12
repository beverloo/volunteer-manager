// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import type { ActionProps } from '../Action';
import { User } from '@lib/auth/User';
import { sealPasswordResetRequest } from '@lib/auth/PasswordReset';

/**
 * Interface definition for the PasswordResetRequest API, exposed through
 * /api/auth/password-reset-request.
 */
export const kPasswordResetRequestDefinition = z.object({
    request: z.object({
        /**
         * The username for whom the password reset request should be issued.
         */
        username: z.string().email(),
    }),

    response: z.strictObject({
        /**
         * Whether an e-mail has been send to their address with a reset password link.
         */
        success: z.boolean(),
    }),
});

export type PasswordResetRequestDefinition = z.infer<typeof kPasswordResetRequestDefinition>;

type Request = PasswordResetRequestDefinition['request'];
type Response = PasswordResetRequestDefinition['response'];

/**
 * This API enables the client to confirm whether an account exists with a particular username. When
 * this is the case, selected WebAuthn data will be included in the response to allow the user to
 * sign in without relying on their password.
 */
export async function passwordResetRequest(request: Request, props: ActionProps)
    : Promise<Response>
{
    const passwordResetData = await User.getPasswordResetData(request.username);
    if (passwordResetData) {
        const passwordResetRequest = await sealPasswordResetRequest({
            id: passwordResetData.userId,
            token: passwordResetData.sessionToken,
        });

        // TODO: Send an actual e-mail. For now we include the link as a response header.
        props.responseHeaders.set(
            'X-Password-Reset-Link', `${origin}/?password-reset-request=${passwordResetRequest}`);

        return { success: true };
    }

    return { success: false };
}
