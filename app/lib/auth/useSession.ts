// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';

import { SessionData, kSessionCookieName, kSessionExpirationTimeSeconds } from './Session';

/**
 * Augment the `iron-session` module with our own `SessionData` type, as that's what will be stored
 * within the cookie for users. This will make autocomplete work correctly.
 */
declare module 'iron-session' {
    interface IronSessionData {
        user?: SessionData;
    }
}

/**
 * Used to retrieve the session based on the current |request|. The session can be manipulated or
 * destroyed as long as no headers have been sent for the |response| yet.
 */
export async function useSession(request: NextRequest, response: NextResponse) {
    if (!Object.hasOwn(process.env, 'APP_COOKIE_PASSWORD'))
        throw new Error('Unable to use sessions when APP_COOKIE_PASSWORD has not been set.');

    return getIronSession(request, response, {
        cookieName: kSessionCookieName,
        password: process.env.APP_COOKIE_PASSWORD,
        ttl: kSessionExpirationTimeSeconds,

        cookieOptions: {
            secure: process.env.NODE_ENV === 'production',
        },
    });
}
