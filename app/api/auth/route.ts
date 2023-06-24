// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { NextRequest, NextResponse } from 'next/server';

import type {
    IdentityRequest, PasswordLoginRequest,
    PasswordLostRequest, PasswordLostVerifyRequest} from '@app/registration/AuthenticationRequest';

import { Session, kSessionCookieName, kSessionExpirationTimeSeconds } from '@lib/auth/Session';
import { User } from '@lib/auth/User';

import { sealPasswordResetRequest, unsealPasswordResetRequest } from '@lib/auth/PasswordReset';
import { securePasswordHash } from '@lib/auth/Password';

/**
 * Implementation of the identity API for the /api/auth endpoint.
 */
async function IdentityAPI(request: IdentityRequest): Promise<NextResponse> {
    const authenticationData = await User.getAuthenticationData(request.username);
    return NextResponse.json({
        success: !!authenticationData,
    });
}

/**
 * Implementation of the password login API for the /api/auth endpoint.
 */
async function PasswordLoginAPI(request: PasswordLoginRequest): Promise<NextResponse> {
    try {
        const securelyHashedPassword = securePasswordHash(request.password);
        const user = await User.authenticateFromPassword(request.username, securelyHashedPassword);
        if (user) {
            const response = NextResponse.json({ success: true });
            response.cookies.set({
                name: kSessionCookieName,
                value: await Session.create({ id: user.userId, token: user.sessionToken }),
                maxAge: kSessionExpirationTimeSeconds,
                httpOnly: true,
            });

            return response;
        }

        console.warn(`[/api/auth] Invalid authentication attempt by ${request.username}`);

    } catch (error) { console.error(error); }

    return NextResponse.json({ success: false });
}

/**
 * Implementation of the password reset API for the /api/auth endpoint.
 */
async function PasswordResetAPI(origin: string, request: PasswordLostRequest)
        : Promise<NextResponse> {
    try {
        const passwordResetData = await User.getPasswordResetData(request.username);
        if (passwordResetData) {
            const passwordResetRequest = await sealPasswordResetRequest({
                userId: passwordResetData.userId,
                sessionToken: passwordResetData.sessionToken,
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
 * Implementation of the password reset verification API for the /api/auth endpoint.
 */
async function PasswordResetVerifyAPI({ request }: PasswordLostVerifyRequest)
        : Promise<NextResponse> {
    try {
        const passwordResetRequest = await unsealPasswordResetRequest(request);
        if (passwordResetRequest) {
            const user = await User.authenticateFromSession({
                id: passwordResetRequest.userId,
                token: passwordResetRequest.sessionToken,
            });

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
 * Implementation of the sign out API for the /api/auth endpoint.
 */
async function SignOutAPI(): Promise<NextResponse> {
    const response = NextResponse.json({ /* no payload */ });
    response.cookies.set({
        name: kSessionCookieName,
        value: '',
        maxAge: 0,
        httpOnly: true,
    });

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

    if (Object.hasOwn(request, 'action')) {
        switch (request.action) {
            case 'password-reset':
                if (Object.hasOwn(request, 'username'))
                    return PasswordResetAPI(nextRequest.nextUrl.origin, request);

                break;

            case 'password-reset-verify':
                if (Object.hasOwn(request, 'request'))
                    return PasswordResetVerifyAPI(request);

                break;

            case 'sign-out':
                return SignOutAPI();
        }
    }

    if (Object.hasOwn(request, 'username')) {
        if (Object.hasOwn(request, 'password'))
            return PasswordLoginAPI(request);
        else
            return IdentityAPI(request);
    }

    return NextResponse.json({ /* no body */ }, { status: 404 });
}
