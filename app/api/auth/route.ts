// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { NextRequest, NextResponse } from 'next/server';

import type {
    ConfirmIdentityRequest, PasswordResetRequest, PasswordResetRequestRequest,
    PasswordResetVerifyRequest, SignInPasswordRequest
} from '@app/registration/AuthenticationRequest';

import { User } from '@lib/auth/User';

import {
    authenticateUserFromPassword, authenticateUserFromSession } from '@lib/auth/Authentication';
import { sealPasswordResetRequest, unsealPasswordResetRequest } from '@lib/auth/PasswordReset';
import { validatePasswordLength } from '@lib/auth/Password';
import { writeEmptySessionCookie, writeSealedSessionCookie } from '@lib/auth/Session';

/**
 * API called to confirm whether an account with the given username exists, and if so, obtain their
 * credential ID and public key for use with passkeys, which are preferred over passwords.
 */
async function ConfirmIdentityAPI(request: ConfirmIdentityRequest): Promise<NextResponse> {
    const authenticationData = await User.getAuthenticationData(request.username);
    return NextResponse.json({
        success: !!authenticationData,
    });
}

/**
 * API called to actually reset a user's password. Included are the password reset request unique to
 * the user and their current state, as well as their desired new password. When successful, should
 * send a new, sealed authentication token automatically signing the user in to their account.
 */
async function PasswordResetAPI(request: PasswordResetRequest): Promise<NextResponse> {
    try {
        const passwordResetRequest = await unsealPasswordResetRequest(request.request);
        if (passwordResetRequest && validatePasswordLength(request.password)) {
            const user = await authenticateUserFromSession(passwordResetRequest);

            if (user) {
                await user.updatePassword(request.password, /* incrementSessionToken= */ true);

                const response = NextResponse.json({ success: true });
                await writeSealedSessionCookie(
                    { id: user.userId, token: user.sessionToken }, response.cookies);

                return response;
            }
        }
    } catch (error) { console.error(error); }

    return NextResponse.json({ success: false });
}

/**
 * API called when the user requests their password to be reset. We don't reset it straight away,
 * instead we create a password reset request and e-mail this to the user. They can then click on
 * the link to re-enter the password reset flow, having proven their identity.
 */
async function PasswordResetRequestAPI(origin: string, request: PasswordResetRequestRequest)
        : Promise<NextResponse> {
    try {
        const passwordResetData = await User.getPasswordResetData(request.username);
        if (passwordResetData) {
            const passwordResetRequest = await sealPasswordResetRequest({
                id: passwordResetData.userId,
                token: passwordResetData.sessionToken,
            });

            const passwordResetLink = `${origin}/?password-reset-request=${passwordResetRequest}`;
            return NextResponse.json({
                success: true,
                tempLink: passwordResetLink,
            });
        }

        console.warn(`[/api/auth] Invalid password reset request by ${request.username}`);

    } catch (error) { console.error(error); }

    return NextResponse.json({ success: false });
}

/**
 * API that verifies a password reset request by unsealing the request, and running the necessary
 * database queries to check whether the request has been issued and settled in the past. When the
 * verification has passed, additional information is returned to personalize the flow.
 */
async function PasswordResetVerifyAPI({ request }: PasswordResetVerifyRequest)
        : Promise<NextResponse> {
    try {
        const passwordResetRequest = await unsealPasswordResetRequest(request);
        if (passwordResetRequest) {
            const user = await authenticateUserFromSession(passwordResetRequest);
            if (user) {
                return NextResponse.json({
                    success: true,
                    firstName: user.firstName,
                });
            }
        }

        console.warn('[/api/auth] Invalid password reset verification');

    } catch (error) { console.error(error); }

    return NextResponse.json({ success: false });
}

/**
 * API that allows the user to sign in to their account with a password. The password shared with
 * the server must be SHA-256 hashed already. A cookie will be set when the password is correct.
 */
async function SignInPasswordAPI(request: SignInPasswordRequest): Promise<NextResponse> {
    try {
        if (validatePasswordLength(request.password)) {
            const user = await authenticateUserFromPassword(request.username, request.password);
            if (user) {
                const response = NextResponse.json({ success: true });
                await writeSealedSessionCookie(
                    { id: user.userId, token: user.sessionToken }, response.cookies);

                return response;
            }
        }

        console.warn(`[/api/auth] Invalid authentication attempt by ${request.username}`);

    } catch (error) { console.error(error); }

    return NextResponse.json({ success: false });
}

/**
 * API that signs the user out of their account by setting an empty authentication session cookie
 * that's due to expire right after receiving it. No verification is done in this method.
 */
async function SignOutAPI(): Promise<NextResponse> {
    const response = NextResponse.json({ /* no payload */ });
    await writeEmptySessionCookie(response.cookies);

    return response;
}

/**
 * The /api/auth endpoint exposes the API for providing user authentication. It can check whether a
 * given user exists, return their public key (for use with passkeys), and authenticate them against
 * their account given an authentication token.
 *
 * Supported request depend on the parameters included in the request body, and are documented in
 * //app/registration/AuthenticationRequest.ts.
 */
export async function POST(nextRequest: NextRequest) {
    const request = await nextRequest.json();
    switch (request.action) {
        case 'confirm-identity':
            if (Object.hasOwn(request, 'username'))
                return ConfirmIdentityAPI(request);

            break;

        case 'password-reset':
            if (Object.hasOwn(request, 'password') && Object.hasOwn(request, 'request'))
                return PasswordResetAPI(request);

            break;

        case 'password-reset-request':
            if (Object.hasOwn(request, 'username'))
                return PasswordResetRequestAPI(nextRequest.nextUrl.origin, request);

            break;

        case 'password-reset-verify':
            if (Object.hasOwn(request, 'request'))
                return PasswordResetVerifyAPI(request);

            break;

        case 'sign-in-password':
            if (Object.hasOwn(request, 'username') && Object.hasOwn(request, 'password'))
                return SignInPasswordAPI(request);

        case 'sign-out':
            return SignOutAPI();
    }

    return NextResponse.json({ /* no body */ }, { status: 404 });
}
