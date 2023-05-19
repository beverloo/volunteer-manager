// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { NextRequest, NextResponse } from 'next/server';

import { AuthenticatedUser } from './AuthenticatedUser';
import { useSession } from './useSession';

/**
 * Used to retrieve the user who is signed in based on the current session. The user's identity will
 * be validated, which means that a database query will be executed following this call.
 *
 * @note Ideally we would cache the AuthenticatedUser instances based on the given |request|,
 *       however IronSession ties its instance to a specific |response| which means that the ability
 *       to log out may not work as expected.
 */
export async function useUser(request: NextRequest, response: NextResponse): Promise<AuthenticatedUser | undefined> {
    let authenticatedUser;

    const session = await useSession(request, response);
    if (session.user)
        authenticatedUser = await AuthenticatedUser.tryAuthenticate(session);

    return authenticatedUser;
}
