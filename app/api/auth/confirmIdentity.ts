// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import { z } from 'zod';

import type { ActionProps } from '../Action';
import type { ApiDefinition, ApiRequest, ApiResponse } from '../Types';
import { Log, LogType, LogSeverity } from '@lib/Log';
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

export type ConfirmIdentityDefinition = ApiDefinition<typeof kConfirmIdentityDefinition>;

type Request = ApiRequest<typeof kConfirmIdentityDefinition>;
type Response = ApiResponse<typeof kConfirmIdentityDefinition>;

/**
 * This API enables the client to confirm whether an account exists with a particular username. When
 * this is the case, selected WebAuthn data will be included in the response to allow the user to
 * sign in without relying on their password.
 */
export async function confirmIdentity(request: Request, props: ActionProps): Promise<Response> {
    const user = await isValidActivatedUser(request.username);

    await Log({
        type: LogType.AccountIdentityCheck,
        severity: LogSeverity.Debug,
        data: {
            userId: user?.userId,
            username: request.username,
            origin: props.origin,
            ip: props.ip,
        }
    });

    if (!user)
        return { success: false };

    let authenticationOptions = undefined;

    const credentials = await retrieveCredentials(user);
    if (credentials.length > 0) {
        authenticationOptions = await generateAuthenticationOptions({
            allowCredentials: credentials.map(credential => ({
                id: isoBase64URL.fromBuffer(credential.credentialId),
                // TODO: `transports`?
            })),
            rpID: props.origin.replace(/\:.*?$/g, ''),  // must be a domain
            userVerification: 'preferred',
        });

        await storeUserChallenge(user, authenticationOptions.challenge);
    }

    return {
        success: true,
        activated: user.activated,
        authenticationOptions
    };
}
