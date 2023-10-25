// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { z } from 'zod';

import type { ActionProps } from '../Action';
import { isValidActivatedUser } from '@lib/auth/Authentication';
import { retrieveCredentials } from './passkeys/PasskeyUtils';
import { storeUserChallenge } from './passkeys/PasskeyUtils';

/**
 * Interface definition for the ConfirmIdentity API, exposed through /api/auth/confirm-identity.
 */
export const kConfirmIdentityDefinition = z.object({
    request: z.object({
        /**
         * The username for whom the associated identity should be found.
         */
        username: z.string().email(),
    }),

    response: z.strictObject({
        /**
         * Whether the identify for the requested user could be found.
         */
        success: z.boolean(),

        /**
         * Whether the account associated with that identity has been activated already.
         */
        activated: z.boolean().optional(),

        /**
         * Authentication options to use with WebAuthn passkey identification.
         */
        authenticationOptions: z.any().optional(),
    }),
});

export type ConfirmIdentityDefinition = z.infer<typeof kConfirmIdentityDefinition>;

type Request = ConfirmIdentityDefinition['request'];
type Response = ConfirmIdentityDefinition['response'];

/**
 * This API enables the client to confirm whether an account exists with a particular username. When
 * this is the case, selected WebAuthn data will be included in the response to allow the user to
 * sign in without relying on their password.
 */
export async function confirmIdentity(request: Request, props: ActionProps): Promise<Response> {
    const user = await isValidActivatedUser(request.username);
    if (!user)
        return { success: false };

    let authenticationOptions = undefined;

    const credentials = await retrieveCredentials(user);
    if (credentials) {
        authenticationOptions = await generateAuthenticationOptions({
            allowCredentials: credentials.map(credential => ({
                id: credential.credentialId,
                type: 'public-key',
            })),
            userVerification: 'preferred',
        });

        await storeUserChallenge(user, authenticationOptions.challenge);
    }

    return {
        success: true,
        activated: user.activated,
        authenticationOptions
    }
}
