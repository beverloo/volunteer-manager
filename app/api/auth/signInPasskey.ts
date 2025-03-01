// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { VerifyAuthenticationResponseOpts } from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { z } from 'zod';

import type { ActionProps } from '../Action';
import type { ApiDefinition, ApiRequest, ApiResponse } from '../Types';
import { RecordLog, kLogSeverity, kLogType } from '@lib/Log';
import { getUserSessionToken } from '@lib/auth/Authentication';
import { isValidActivatedUser } from '@lib/auth/Authentication';
import { determineRpID, retrieveCredentials, retrieveUserChallenge, storeUserChallenge, updateCredentialCounter }
    from './passkeys/PasskeyUtils';
import { writeSealedSessionCookie } from '@lib/auth/Session';

/**
 * Interface definition for the SignIn API, exposed through /api/auth/sign-in-passkey.
 */
export const kSignInPasskeyDefinition = z.object({
    request: z.object({
        /**
         * The username whom is attempting to sign in to their account.
         */
        username: z.string().email(),

        /**
         * The verification that was generated by their authenticator.
         */
        verification: z.any(),
    }),

    response: z.strictObject({
        /**
         * Whether the sign in attempt was successful.
         */
        success: z.boolean(),

        /**
         * Optional detailed information on what went wrong in the action.
         */
        error: z.string().optional(),
    }),
});

export type SignInPasskeyDefinition = ApiDefinition<typeof kSignInPasskeyDefinition>;

/**
 * Returns whether the `left` and the `right` buffers are equal to each other.
 */
function areBuffersEqual(left: Uint8Array, right: Uint8Array): boolean {
    if (left.length !== right.length)
        return false;

    for (let index = 0; index < left.length; ++index) {
        if (left[index] !== right[index])
            return false;
    }

    return true;
}

type Request = ApiRequest<typeof kSignInPasskeyDefinition>;
type Response = ApiResponse<typeof kSignInPasskeyDefinition>;

/**
 * API that allows the user to sign in to their account with a passkey.
 */
export async function signInPasskey(request: Request, props: ActionProps): Promise<Response> {
    const user = await isValidActivatedUser(request.username);
    if (!user)
        return { success: false };

    const rpID = determineRpID(props);

    const challenge = await retrieveUserChallenge(user);
    const credentials = await retrieveCredentials(user, rpID);
    const sessionToken = await getUserSessionToken(user);

    if (!challenge || !credentials.length || !sessionToken)
        return { success: false, error: 'Unable to load the challenge and credential' };

    try {
        const requestedCredentialId = Buffer.from(request.verification.id, 'base64url');

        let credentialPasskeyId: number | undefined = undefined;
        let credential: VerifyAuthenticationResponseOpts['credential'] | undefined;

        for (const potentialCredential of credentials) {
            if (!areBuffersEqual(requestedCredentialId, potentialCredential.credentialId))
                continue;

            credentialPasskeyId = potentialCredential.passkeyId;
            credential = {
                id: isoBase64URL.fromBuffer(potentialCredential.credentialId),
                publicKey: potentialCredential.credentialPublicKey,
                counter: Number(potentialCredential.counter),
            };
        }

        if (!credentialPasskeyId || !credential)
            return { success: false, error: 'Unable to find the used credential Id' };

        const verification = await verifyAuthenticationResponse({
            response: request.verification!,

            expectedChallenge: challenge,
            expectedOrigin: props.origin,
            expectedRPID: rpID,

            credential
        });

        if (!verification.verified)
            return { success: false, error: 'Unable ot verify the authentication response' };

        await storeUserChallenge(user, /* reset= */ null);
        await updateCredentialCounter(
            user, credentialPasskeyId, BigInt(verification.authenticationInfo.newCounter));

        RecordLog({
            type: kLogType.AccountIdentifyPasskey,
            severity: kLogSeverity.Debug,
            sourceUser: user.userId,
            data: { ip: props.ip },
        });

        await writeSealedSessionCookie(
            { id: user.userId, token: sessionToken }, props.responseHeaders);

        return { success: true };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
