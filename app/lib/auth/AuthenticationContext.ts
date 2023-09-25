// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import type { SessionData } from './Session';
import type { User } from './User';
import { authenticateUser } from './Authentication';
import { getSessionFromCookieStore, getSessionFromHeaders } from './getSession';

// https://github.com/vercel/next.js/discussions/44270
const headers = import('next/headers');

/**
 * Authentication Context specific to signed in users. Includes the user, as well as an overview of
 * the events that they've got access to.
 */
export interface UserAuthenticationContext {
    /**
     * The user who is currently signed in to their account.
     */
    user: User;
}

/**
 * Authentication Context specific to visitors.
 */
export interface VisitorAuthenticationContext {
    /**
     * The user who is currently signed in to their account. Undefined for visitors.
     */
    user: undefined;
}

/**
 * Authentication Context, which defines not just the signed in user, but also detailed access
 * information about the level of access they have to different events.
 */
export type AuthenticationContext = UserAuthenticationContext | VisitorAuthenticationContext;

/**
 * Determines the authentication context from the cookies included with the current request. May
 * only be used by server-side components, as authentication requires a database query.
 */
export async function getAuthenticationContext(): Promise<AuthenticationContext> {
    const sessionData = await getSessionFromCookieStore((await headers).cookies());
    if (sessionData)
        return getAuthenticationContextFromSessionData(sessionData);

    return { user: /* visitor= */ undefined };
}

/**
 * Determines the authentication context based on the given `headers`. May only be used by server-
 * side components, as authentication requires a fdatabase query.
 */
export async function getAuthenticationContextFromHeaders(headers: Headers)
    : Promise<AuthenticationContext>
{
    const sessionData = await getSessionFromHeaders(headers);
    if (sessionData)
        return getAuthenticationContextFromSessionData(sessionData);

    return { user: /* visitor= */ undefined };
}

/**
 * Determines the authentication context from the cookies included with the current request, and
 * will issue a HTTP 404 Not Found error when none could be loaded. May only be used by server-side
 * components, as authentication requires a database query.
 */
export async function requireAuthenticationContext(): Promise<UserAuthenticationContext> {
    const authenticationContext = await getAuthenticationContext();
    if (!authenticationContext.user)
        notFound();

    return authenticationContext;
}

/**
 * Actually gets the authentication context from the given `sessionData`.
 */
async function getAuthenticationContextFromSessionData(sessionData: SessionData)
    : Promise<AuthenticationContext>
{
    return authenticateUser({ type: 'session', ...sessionData });
}
