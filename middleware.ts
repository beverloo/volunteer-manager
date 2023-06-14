// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { NextRequest, NextResponse } from 'next/server';

import { Session, kSessionCookieName, kSessionExpirationTimeSeconds } from './app/lib/auth/Session';

/**
 * Endpoint (full pathname) through which login functionality is exposed.
 */
const kEndpointAuthLogin = '/auth-api/login';

/**
 * Endpoint (full pathname) through which logout functionality is exposed.
 */
const kEndpointAuthLogout = '/auth-api/logout';

/**
 * Determines the URL to which the user should be navigated after the middleware action has been
 * completed. We consider the `returnTo` search param and otherwise default to the domain's root.
 * Only pathnames absolute to the current origin are considered.
 */
function determineRedirectUrl(request: NextRequest): URL {
    const candidate = request.nextUrl.searchParams.get('returnTo');
    if (candidate && candidate.startsWith('/'))
        return new URL(candidate, request.url);

    return new URL('/', request.url);
}

/**
 * In order to deal with authentication in NextJS with the app router, where headers (& cookies) are
 * read-only, we use a middleware to handle user authentication and logout -- both of which depend
 * on the ability to set or delete cookies. Two endpoints are exposed:
 *
 * /auth-api/login
 *   - Must be a POST request containing authentication information.
 *   - May include a `returnTo` request parameter (analogous to `RelayState` in SSO).
 *     - Will redirect to the domain root in absence of such information.
 *
 * /auth-api/logout
 *   - Must be a GET request containing no request body.
 *   - May include a `returnTo` request parameter (analogous to `RelayState` in SSO).
 *     - Will redirect to the domain root in absence of such information.
 *
 * For all other URLs, middleware is used to inject a header with the current page URL. This enables
 * authentication that automatically links back to the requesting page.
 *
 * @see https://github.com/vercel/next.js/discussions/49843#discussion-5200631
 * @see https://github.com/vercel/next.js/issues/43704
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

    // TODO: Remove the following once there is a mechanism for server components to retrieve the
    // current URL and/or pathname. This is currently blocked by the following issue:
    // https://github.com/vercel/next.js/issues/43704

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('X-Request-Origin', request.nextUrl.origin);
    requestHeaders.set('X-Request-Path', request.nextUrl.pathname);

    return NextResponse.next({ request: { headers: requestHeaders } });
}
