// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { z } from 'zod';

import { type ActionProps, noAccess } from '../../Action';
import { LogSeverity, LogType, Log } from '@lib/Log';
import { getEnvironmentIterator } from '@lib/Environment';
import { retrieveUserChallenge, storePasskeyRegistration, storeUserChallenge }
    from './PasskeyUtils';

/**
 * Interface definition for the Passkeys API, exposed through /api/auth/passkeys.
 */
export const kRegisterPasskeyDefinition = z.object({
    request: z.object({
        /**
         * Name to associate with this passkey. Optional.
         */
        name: z.string().optional(),

        /**
         * The registration that was created by the browser in response to the offered challenge.
         */
        registration: z.any(),
    }),
    response: z.strictObject({
        /**
         * Whether the operation could be executed successfully.
         */
        success: z.boolean(),

        /**
         * Error message in case the operation failed.
         */
        error: z.string().optional(),
    }),
});

export type RegisterPasskeyDefinition = z.infer<typeof kRegisterPasskeyDefinition>;

type Request = RegisterPasskeyDefinition['request'];
type Response = RegisterPasskeyDefinition['response'];

/**
 * The domain used for local development of the Volunteer Manager.
 */
export const kLocalDevelopmentDomain = 'localhost';

/**
 * The origin on which local development for the Volunteer Manager takes place. Passkey responses
 * for this origin are being accepted as well, to make it possible to end-to-end test the flow.
 */
export const kLocalDevelopmentOrigin = 'http://localhost:3000';

/**
 * Verifies the registration response and registers the new passkey when sound.
 */
export async function registerPasskey(request: Request, props: ActionProps): Promise<Response> {
    if (!props.user || !props.user.username)
        noAccess();

    const expectedChallenge = await retrieveUserChallenge(props.user);
    if (!expectedChallenge)
        return { success: false, error: 'You are not currently in a passkey registration flow' };

    const environments = [ ...await getEnvironmentIterator() ];
    const environmentDomains = environments.map(environment => environment.environmentName);
    const environmentOrigins = environments.map(environment =>
        `https://${environment.environmentName}`);

    try {
        const verification = await verifyRegistrationResponse({
            response: request.registration,
            expectedChallenge,
            expectedOrigin: [ ...environmentOrigins, kLocalDevelopmentOrigin ],
            expectedRPID: [ ...environmentDomains, kLocalDevelopmentDomain ],
        });

        if (!verification.verified || !verification.registrationInfo)
            return { success: false, error: 'The passkey registration could not be verified' };

        await storePasskeyRegistration(props.user, request.name, verification.registrationInfo);
        await storeUserChallenge(props.user, /* reset= */ null);

        await Log({
            type: LogType.AccountPasskeyCreate,
            severity: LogSeverity.Debug,
            sourceUser: props.user,
            data: { ip: props.ip },
        });

        return {
            success: true,
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message,
        };
    }
}
