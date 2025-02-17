// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { forbidden } from 'next/navigation';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { z } from 'zod';

import type { ActionProps } from '../../Action';
import type { ApiDefinition, ApiRequest, ApiResponse } from '../../Types';
import { Log, kLogSeverity, kLogType } from '@lib/Log';
import { determineRpID, retrieveUserChallenge, storePasskeyRegistration, storeUserChallenge }
    from './PasskeyUtils';

import db, { tEnvironments } from '@lib/database';

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

export type RegisterPasskeyDefinition = ApiDefinition<typeof kRegisterPasskeyDefinition>;

type Request = ApiRequest<typeof kRegisterPasskeyDefinition>;
type Response = ApiResponse<typeof kRegisterPasskeyDefinition>;

/**
 * The origin on which local development for the Volunteer Manager takes place. Passkey responses
 * for this origin are being accepted as well, to make it possible to end-to-end test the flow.
 */
export const kLocalDevelopmentOrigin = 'http://localhost:3000';

/**
 * Function that queries the database to get all origins that represent environments for the
 * AnimeCon volunteer manager.
 */
export async function getAllEnvironmentOrigins(): Promise<string[]> {
    const environments = await db.selectFrom(tEnvironments)
        .selectOneColumn(tEnvironments.environmentDomain)
        .executeSelectMany();

    return environments.map(environment => [
        `https://${environment}`,
        `https://staging.${environment}`
    ]).flat();
}

/**
 * Verifies the registration response and registers the new passkey when sound.
 */
export async function registerPasskey(request: Request, props: ActionProps): Promise<Response> {
    if (!props.user || !props.user.username)
        forbidden();

    const expectedChallenge = await retrieveUserChallenge(props.user);
    if (!expectedChallenge)
        return { success: false, error: 'You are not currently in a passkey registration flow' };

    const rpID = determineRpID(props);

    const environmentOrigins = await getAllEnvironmentOrigins();

    try {
        const verification = await verifyRegistrationResponse({
            response: request.registration,
            expectedChallenge,
            expectedOrigin: [ ...environmentOrigins, kLocalDevelopmentOrigin ],
            expectedRPID: rpID,
        });

        if (!verification.verified || !verification.registrationInfo)
            return { success: false, error: 'The passkey registration could not be verified' };

        await storePasskeyRegistration(
            props.user, rpID, request.name, verification.registrationInfo);

        await storeUserChallenge(props.user, /* reset= */ null);

        await Log({
            type: kLogType.AccountPasskeyCreate,
            severity: kLogSeverity.Debug,
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
