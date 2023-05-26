// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

/**
 * Name of the cookie in which session data will be stored.
 */
export const kSessionCookieName = 'auth';

/**
 * Number of seconds after which the authentication cookie should expire. Currently set to half a
 * year to make sure people sign in again at least once per conference.
 */
export const kSessionExpirationTimeSeconds = 180 * 24 * 60 * 60;

/**
 * The data that will be stored in the cookie. This data will be send to the server during every
 * HTTP request, which means that we should attempt to keep it as light as possible.
 */
export interface SessionData {
    /**
     * Unique ID of the user who is currently signed in to this account.
     */
    id: number;

    /**
     * Session token for the user. This is used to allow users to invalidate all remote sessions in
     * case they believe their account has been compromised.
     */
    token: number;
}
