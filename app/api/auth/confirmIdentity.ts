// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import { z } from 'zod';

import type { ActionProps } from '../Action';
import type { ApiDefinition, ApiRequest, ApiResponse } from '../Types';
import { RecordLog, kLogSeverity, kLogType } from '@lib/Log';
import { determineRpID, retrieveCredentials, storeUserChallenge } from './passkeys/PasskeyUtils';
import { isValidActivatedUser } from '@lib/auth/Authentication';

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

    RecordLog({
        type: kLogType.AccountIdentityCheck,
        severity: kLogSeverity.Debug,
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

    const rpID = determineRpID(props);

    const existingCredentials = await retrieveCredentials(user, rpID);
    if (existingCredentials.length > 0) {
        const options = await generateAuthenticationOptions({
            rpID,

            allowCredentials: existingCredentials.map(credential => ({
                id: isoBase64URL.fromBuffer(credential.credentialId),
            })),
        });

        await storeUserChallenge(user, options.challenge);

        authenticationOptions = {
            optionsJSON: options,
            useBrowserAutofill: false,
        };
    }

    return {
        success: true,
        activated: user.activated,
        authenticationOptions,
    };
}
