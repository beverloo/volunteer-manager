// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { Crypto } from '@peculiar/webcrypto';
import { defaults as ironDefaults, seal, unseal } from 'iron-webcrypto';

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
 * The password through which the session will be sealed. A start-up exception will be thrown when
 * this value is not available, as we would not be able to provide security to our visitors.
 */
const kSessionPassword = process.env.APP_COOKIE_PASSWORD;
if (!kSessionPassword || !kSessionPassword.length)
    throw new Error('Unable to start the Volunteer Manager without a set APP_COOKIE_PASSWORD');

/**
 * Prefer use of the Web Crypto implementation offered natively (in browsers & NodeJS v19+), fall
 * back to the implementation provided by the @peculiar/webcrypto package.
 */
const kWebCryptoImpl = globalThis.crypto || new Crypto();

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

/**
 * Represents a Session. Instances can only be obtained by validating a sealed session, whereas
 * sealed sessions can only be obtained by creating one for an authenticated user.
 */
export class Session implements SessionData {
    /**
     * Creates a new, sealed Iron session based on the given |sessionData|. When successful, a
     * sealed Iron session cookie will be returned as a string. NULL will be returned in all other
     * cases, which signals that creation failed.
     *
     * @param sessionData The session data for which a sealed session should be created.
     * @return A sealed Iron session when creation was successful, NULL in all other cases.
     */
    static create(sessionData: SessionData): Promise<string | null> {
        return seal(kWebCryptoImpl, sessionData, kSessionPassword, {
            ...ironDefaults,
            ttl: kSessionExpirationTimeSeconds * /* milliseconds= */ 1000,
        });
    }

    /**
     * Verifies that the given sealed |sealedSession| can be decrypted and has not expired. A
     * plaintext Session will be returned when successful. NULL will be returned in all other
     * cases, which signals that validation failed, with no further information as to the cause.
     *
     * @param sealedSession The sealed Iron session potentially containing session information.
     * @returns The plaintext session data when validation passed, NULL in all other cases.
     */
    static async verify(sealedSession: string): Promise<Session | null> {
        try {
            const sessionData = await unseal(kWebCryptoImpl, sealedSession, kSessionPassword, {
                ...ironDefaults,
                ttl: kSessionExpirationTimeSeconds * /* milliseconds= */ 1000,
            });

            if (!Session.verifySessionData(sessionData))
                throw new Error('The unsealed session data does not conform to SessionData');

            return new Session(sessionData);

        } catch (error) {
            console.warn('Invalid session seen in request', error);
        }

        return null;
    }

    /**
     * Verifies that the given |sessionData| is a valid SessionData structure. We require all fields
     * to be present and of the right types, stored in an object.
     */
    private static verifySessionData(sessionData: any): sessionData is SessionData {
        return typeof sessionData === 'object' &&
               (Object.hasOwn(sessionData, 'id') && typeof sessionData.id === 'number') &&
               (Object.hasOwn(sessionData, 'token') && typeof sessionData.token === 'number');
    }

    private sessionData: SessionData;

    private constructor(sessionData: SessionData) {
        this.sessionData = sessionData;
    }

    get id(): number { return this.sessionData.id; }
    get token(): number { return this.sessionData.token; }
}
