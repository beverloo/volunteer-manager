// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

import { User } from './User';
import { getServerPathname } from '../getServerPathname';
import { useSession } from './useSession';

/**
 * Valid behaviours that can be specified when using useUser().
 */
type InvalidUserBehaviour = 'ignore' | 'not-found' | 'redirect' | 'request-login';

/**
 * A cache used to cache the results of useUser() for a particular request, as identified by the
 * cookies() instance (which NextJS stores in the RequestAsyncStorage).
 */
const kUserCache = new WeakMap<ReturnType<typeof cookies>, User>();

/**
 * Returns the User that is signed in for the current page view, or undefined in case they are not
 * signed in to any (valid) session.
 */
export async function useUser(behaviour: 'ignore'): Promise<User | undefined>;

/**
 * Returns the User that is signed in for the current page view, or displays an HTTP 404 Not Found
 * error instead.
 */
export async function useUser(behaviour: 'not-found'): Promise<User>;

/**
 * Returns the User that is signed in for the current page view, or redirects them to the given
 * |redirectUrl| instead. When no |redirectUrl| has been given, the root page will be used.
 */
export async function useUser(behaviour: 'redirect', redirectUrl?: string): Promise<User>;

/**
 * Returns the User that is signed in for the current page view, or redirects them to the login page
 * instead. They will be redirected back to the current page after a successful login.
 */
export async function useUser(behaviour?: 'request-login'): Promise<User>;

/**
 * Returns the User that is signed in for the current page view. When no (valid) user could be
 * found, |behaviour| decides on the next steps:
 *
 * 'ignore'
 *     The error will be accepted and an undefined user will be returned.
 *
 * 'not-found'
 *     A response will be generated carrying a HTTP 404 Not Found status code.
 *
 * 'redirect'
 *     A response will be generated that redirects the user to the given |behaviourParam|. The URL
 *     defaults to the root page of the domain this application runs on.
 *
 * 'request-login' (default)
 *     A response will be generated that redirects the user to the login page. They will be
 *     redirected back to the current page after a successful login.
 *
 * A valid user means that the session has been fully authenticated and can be trusted.
 */
export async function useUser(behaviour?: InvalidUserBehaviour, behaviourParam?: string)
        : Promise<User | undefined> {
    const requestIdentifier = cookies();
    if (kUserCache.has(requestIdentifier))
        return kUserCache.get(requestIdentifier);

    const session = await useSession(/* behaviour= */ 'ignore');  // eslint-disable-line
    if (session) {
        const user = await User.authenticateFromSession(session);
        kUserCache.set(requestIdentifier, user);

        if (user)
            return user;
    }

    switch (behaviour) {
        case 'not-found':
            notFound();

        case 'redirect':
            redirect(behaviourParam || '/');

        case 'request-login':
            redirect('/auth-api/login?returnTo=' + getServerPathname());
    }

    return undefined;
}
