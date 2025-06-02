// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { forbidden } from 'next/navigation';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { z } from 'zod/v4';

import type { ActionProps } from '../../Action';
import type { ApiDefinition, ApiRequest, ApiResponse } from '../../Types';
import { RecordLog, kLogSeverity, kLogType } from '@lib/Log';
import { determineOrigin, determineRpID, retrieveUserChallenge, storePasskeyRegistration, storeUserChallenge }
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

export type RegisterPasskeyDefinition = ApiDefinition<typeof kRegisterPasskeyDefinition>;

type Request = ApiRequest<typeof kRegisterPasskeyDefinition>;
type Response = ApiResponse<typeof kRegisterPasskeyDefinition>;

/**
 * Verifies the registration response and registers the new passkey when sound.
 */
export async function registerPasskey(request: Request, props: ActionProps): Promise<Response> {
    if (!props.user || !props.user.username)
        forbidden();

    const expectedChallenge = await retrieveUserChallenge(props.user);
    if (!expectedChallenge)
        return { success: false, error: 'You are not currently in a passkey registration flow' };

    const origin = determineOrigin(props);
    const rpID = determineRpID(props);

    try {
        const verification = await verifyRegistrationResponse({
            response: request.registration,
            expectedChallenge,
            expectedOrigin: origin,
            expectedRPID: rpID,
        });

        if (!verification.verified || !verification.registrationInfo)
            return { success: false, error: 'The passkey registration could not be verified' };

        await storePasskeyRegistration(
            props.user, rpID, request.name, verification.registrationInfo);

        await storeUserChallenge(props.user, /* reset= */ null);

        RecordLog({
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
