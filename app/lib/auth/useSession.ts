// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

import { type SessionData, kSessionCookieName, unsealSession } from './Session';

/**
 * Valid behaviours that can be specified when using useSession().
 */
export type InvalidSessionBehaviour = 'ignore' | 'not-found' | 'redirect';

/**
 * Returns the unsealed Session that was included in the cookies included in the HTTP request, or
 * undefined in case they don't have a (valid) session.
 */
export async function useSession(behaviour?: 'ignore'): Promise<SessionData | undefined>;

/**
 * Returns the unsealed Session that was included in the cookies included in the HTTP request, or
 * displays an HTTP 404 not-found error instead.
 */
export async function useSession(behaviour: 'not-found'): Promise<SessionData>;

/**
 * Returns the unsealed Session that was included in the cookies included in the HTTP request, or
 * redirects them to the given |redirectUrl| when they don't have a (valid) session. The redirect
 * will default to the root page on the current domain.
 */
export async function useSession(behaviour: 'redirect', redirectUrl?: string): Promise<SessionData>;

/**
 * Returns the unsealed Session that was included in the cookies included in the HTTP request. When
 * no (valid) session could be found, |behaviour| decides on the next steps:
 *
 *   (default)
 *       By default, the error will be accepted and an undefined session will be returned.
 *
 *   'not-found'
 *       A response will be generated carrying a HTTP 404 Not Found status code.
 *
 *   'redirect'
 *       A response will be generated that redirects the user to the given |behaviourParam|. The URL
 *       defaults to the root page of the domain this application runs on.
 *
 * A valid session makes no guarantees about validity of the information carried therein, only that
 * the session data was set and sealed by this application.
 */
export async function useSession(behaviour?: InvalidSessionBehaviour, behaviourParam?: any)
        : Promise<SessionData | undefined> {
    const cookieStore = cookies();

    let session: SessionData | undefined;

    // (1) Verify and unseal the session cookie, if it exists, using Iron.
    if (cookieStore.has(kSessionCookieName)) {
        try {
            session = await unsealSession(cookieStore.get(kSessionCookieName)!.value);

        } catch { /* TODO: remove the cookie once I figure out how to */ }
    }

    // (2) When no session could be verified, respond depending on the requested |behaviour|. Either
    // a not found (HTTP 404) error could be shown, the user is to be redirected to a particular URL
    // or the error is ignored and undefined is returned.
    if (!session) {
        switch (behaviour) {
            case 'not-found':
                notFound();

            case 'redirect':
                redirect(behaviourParam || '/');
        }
    }

    return session;
}
