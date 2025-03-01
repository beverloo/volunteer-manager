// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { forbidden, notFound } from 'next/navigation';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { isoBase64URL, isoUint8Array } from '@simplewebauthn/server/helpers';
import { z } from 'zod';

import type { ActionProps } from '../../Action';
import type { ApiDefinition, ApiRequest, ApiResponse } from '../../Types';
import { determineEnvironment } from '@lib/Environment';
import { determineRpID, retrieveCredentials, storeUserChallenge } from './PasskeyUtils';

/**
 * Interface definition for the Passkeys API, exposed through /api/auth/passkeys.
 */
export const kCreateChallengeDefinition = z.object({
    request: z.object({ /* no parameters */ }),
    response: z.strictObject({
        /**
         * Whether the operation could be executed successfully.
         */
        success: z.boolean(),

        /**
         * Error message in case the operation failed.
         */
        error: z.string().optional(),

        /**
         * When successful, the options that can be used in the browser.
         */
        options: z.any().optional(),
    }),
});

export type CreateChallengeDefinition = ApiDefinition<typeof kCreateChallengeDefinition>;

type Request = ApiRequest<typeof kCreateChallengeDefinition>;
type Response = ApiResponse<typeof kCreateChallengeDefinition>;

/**
 * Creates a new challenge for the signed in user. In order for this API to work, we require:
 *   1) The user to be signed in to their account,
 *   2) The request to be made with a valid environment, as passkeys are origin-associated.
 */
export async function createChallenge(request: Request, props: ActionProps): Promise<Response> {
    if (!props.user || !props.user.username)
        forbidden();

    const environment = await determineEnvironment();
    if (!environment)
        notFound();

    const rpID = determineRpID(props);

    const existingCredentials = await retrieveCredentials(props.user, rpID);

    const options = await generateRegistrationOptions({
        rpName: `AnimeCon ${environment.title}`,
        rpID,

        userName: props.user.username,
        userDisplayName: props.user.name,

        attestationType: 'none',

        excludeCredentials: existingCredentials.map(credential => ({
            id: isoBase64URL.fromBuffer(credential.credentialId),
        })),

        authenticatorSelection: {
            // Will always generate synced passkeys on Android devices, but consumes discoverable
            // credential slots on security keys.
            residentKey: 'preferred',

            // Will perform user verification when possible, but will skip any prompts for PIN or
            // local login password when possible. In these instances user verification can
            // sometimes be false.
            userVerification: 'preferred',
        },
    });

    if (!options || !options.challenge)
        return { success: false, error: 'Unable to generate a registration response' };

    await storeUserChallenge(props.user, options.challenge);

    return {
        success: true,
        options: {
            optionsJSON: options,
        },
    };
}
