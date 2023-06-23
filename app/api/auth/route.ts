// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { NextRequest, NextResponse } from 'next/server';

import { User } from '../../lib/auth/User';

/**
 * The /api/auth endpoint exposes the API for providing user authentication. It can check whether a
 * given user exists, return their public key (for use with passkeys), and authenticate them against
 * their account given an authentication token.
 *
 * Supported requests are as follows, whereas unsupported requests will throw an error:
 *
 *   (1)
 *       - Request { username: string }
 *       - Response { exists: boolean; credentialId?: string; publicKey?: string }
 *
 * TODO: Support WebAuthn/passkeys in the authentication flow.
 * TODO: Support password reset in the authentication flow.
 */
export async function POST(nextRequest: NextRequest) {
    const request = await nextRequest.json();

    if (Object.hasOwn(request, 'username')) {
        // Case (1): Confirm whether there exists any user with the given username.
        const authenticationData = await User.getAuthenticationData(request.username);
        return NextResponse.json({
            exists: !!authenticationData,
        });
    }

    return NextResponse.error();
}