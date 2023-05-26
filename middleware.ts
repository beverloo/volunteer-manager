// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { NextRequest, NextResponse } from 'next/server';
import { notFound } from 'next/navigation';

import { Session, kSessionCookieName, kSessionExpirationTimeSeconds } from './app/lib/auth/Session';

/**
 * Endpoint (full pathname) through which login functionality is exposed.
 */
const kEndpointAuthLogin = '/auth/login';

/**
 * Endpoint (full pathname) through which logout functionality is exposed.
 */
const kEndpointAuthLogout = '/auth/logout';

/**
 * Determines the URL to which the user should be navigated after the middleware action has been
 * completed. We prefer the `X-Redirect-To` header, then consider the `RelayState` search param,
 * then default to the domain's root. Only pathnames absolute to the current origin are considered.
 */
function determineRedirectUrl(request: NextRequest): URL {
    let candidate: string | undefined;

    if (request.headers.has('X-Redirect-To'))
        candidate = request.headers.get('X-Redirect-To');
    else if (request.nextUrl.searchParams.has('RelayState'))
        candidate = request.nextUrl.searchParams.get('RelayState');

    if (candidate && candidate.startsWith('/'))
        return new URL(candidate, request.url);

    return new URL('/', request.url);
}

/**
 * In order to deal with authentication in NextJS with the app router, where headers (& cookies) are
 * read-only, we use a middleware to handle user authentication and logout -- both of which depend
 * on the ability to set or delete cookies. Two endpoints are exposed:
 *
 * /auth/login
 *   - Must be a POST request containing authentication information.
 *   - May include a `RelayState` field (common for SSO) or an `X-Redirect-To` HTTP header.
 *     - Will redirect to the domain root in absence of such information.
 *
 * /auth/logout
 *   - Must be a GET request containing no request body.
 *   - May include a `RelayState` request param (common for SSO) or an `X-Redirect-To` HTTP header.
 *     - Will redirect to the domain root in absence of such information.
 *
 * @see https://github.com/vercel/next.js/discussions/49843#discussion-5200631
 */
export async function middleware(request: NextRequest) {
    if (request.nextUrl.pathname.startsWith(kEndpointAuthLogin)) {
        // TODO: Actually authenticate the user.
        const sessionData = {
            id: 1,
            token: 1,
        };

        const sealedSession = await Session.create(sessionData);
        if (!sealedSession)
            return new NextResponse(/* body= */ null, { status: 403 });

        const response = NextResponse.redirect(determineRedirectUrl(request));
        response.cookies.set(kSessionCookieName, sealedSession, {
            httpOnly: true,
            maxAge: kSessionExpirationTimeSeconds,
            sameSite: 'lax',
            secure: true,
        });

        return response;
    }

    if (request.nextUrl.pathname.startsWith(kEndpointAuthLogout)) {
        const response = NextResponse.redirect(determineRedirectUrl(request));
        response.cookies.set(kSessionCookieName, /* empty= */ '', {
            httpOnly: true,
            maxAge: 0,  // delete immediate
            sameSite: 'lax',
            secure: true,
        });

        return response;
    }

    notFound();
}

/**
 * Paths that should be captured by the middleware. Since middleware is injected in every request,
 * we should be conservative to avoid running code when we don't need to.
 *
 * Note that the endpoint constants are duplicated because of the way NextJS parses them:
 * https://nextjs.org/docs/messages/invalid-page-config
 */
export const config = {
    experimental: {
        runtime: 'nodejs',
    },
    matcher: [
        /* kEndpointAuthLogin= */   '/auth/login',
        /* kEndpointAuthLogout= */  '/auth/logout',
    ],
};
