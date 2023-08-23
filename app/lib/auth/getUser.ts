// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import type { SessionData } from './Session';
import type { User } from './User';
import { authenticateUserFromSession } from './Authentication';
import { getSessionFromCookieStore, getSessionFromHeaders } from './getSession';

// https://github.com/vercel/next.js/discussions/44270
const headers = import('next/headers');

/**
 * Returns the User that is signed in for the current page view, or undefined in case they are not
 * signed in to any (valid) session. The NextJS cookie store will be used to determine the session.
 *
 * @returns The signed in user when they have been validated, or undefined.
 */
export async function getUser(): Promise<User | undefined> {
    const sessionData = await getSessionFromCookieStore((await headers).cookies());
    if (sessionData)
        return getUserFromSession(sessionData);

    return undefined;
}

/**
 * Returns the User that is signed in for the current page view, or undefined in case they are not
 * signed in to any (valid) session. The NextJS cookie store will be used to determine the session.
 *
 * @returns The signed in user when they have been validated.
 */
export async function requireUser(): Promise<User> {
    const user = await getUser();
    if (!user)
        notFound();  // never returns

    return user;
}

/**
 * Returns the User that is signed in for the current page view, or undefined in case they are not
 * signed in to any (valid) session. The given `headers` will be used to determine the session.
 *
 * @param headers The HTTP headers that were made available as part of the incoming request.
 * @returns The signed in user when they have been validated, or undefined.
 */
export async function getUserFromHeaders(headers: Headers): Promise<User | undefined> {
    const sessionData = await getSessionFromHeaders(headers);
    if (sessionData)
        return getUserFromSession(sessionData);

    return undefined;
}

/**
 * Returns the User that is signed in for the given `session`, or undefined in case we are not able
 * to validate the session information with anything in the database.
 *
 * @param sessionData The unsealed session containing the user's session information.
 * @returns The signed in user when they have been validated, or undefined.
 */
async function getUserFromSession(sessionData: SessionData): Promise<User | undefined> {
    return authenticateUserFromSession(sessionData);
}
