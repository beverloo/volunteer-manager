// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { generateRegistrationOptions } from '@simplewebauthn/server';
import { notFound } from 'next/navigation';
import { z } from 'zod';

import { type ActionProps, noAccess } from '../../Action';
import { determineEnvironment } from '@lib/Environment';
import { retrieveCredentials, storeUserChallenge } from './PasskeyUtils';

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

export type CreateChallengeDefinition = z.infer<typeof kCreateChallengeDefinition>;

type Request = CreateChallengeDefinition['request'];
type Response = CreateChallengeDefinition['response'];

/**
 * Creates a new challenge for the signed in user. In order for this API to work, we require:
 *   1) The user to be signed in to their account,
 *   2) The request to be made with a valid environment, as passkeys are origin-associated.
 */
export async function createChallenge(request: Request, props: ActionProps): Promise<Response> {
    if (!props.user || !props.user.username)
        noAccess();

    const environment = await determineEnvironment();
    if (!environment)
        notFound();

    const credentials = await retrieveCredentials(props.user) ?? [];

    const options = await generateRegistrationOptions({
        rpName: `AnimeCon ${environment.environmentTitle}`,
        rpID: environment.environmentName,
        userID: `${props.user.userId}`,
        userName: props.user.username,
        userDisplayName: `${props.user.firstName} ${props.user.lastName}`,
        attestationType: 'none',
        excludeCredentials: credentials.map(credential => ({
            id: credential.credentialId,
            type: 'public-key',
        })),
    });

    // Don't use the "relying party identifier": it defaults to the current domain, which is the
    // behaviour we want as we're a multi-tenant system that wants to work on localhost too.
    options.rp.id = undefined;

    if (!options || !options.challenge)
        return { success: false, error: 'Unable to generate a registration response' };

    await storeUserChallenge(props.user, options.challenge);

    return {
        success: true,
        options,
    };
}
