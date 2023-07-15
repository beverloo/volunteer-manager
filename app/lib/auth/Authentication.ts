// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type SessionData } from './Session';
import { type UserDatabaseRow, User } from './User';

import { securePasswordHash } from './Password';
import { sql } from '../database';

/**
 * Fetches authentication data for a particular user. Will be relayed to the frontend allowing them
 * to sign in to their account, preferably using passkeys.
 */
export interface AuthenticationData {
    /**
     * Whether the account has been activated already.
     */
    activated: boolean;

    /**
     * Bytes containing the credential Id using which the user has registered.
     */
    credentialId?: string;

    /**
     * Bytes containing the public key using which the user has registered.
     */
    publicKey?: string;
}

/**
 * Attempts to authenticate the user based on the given `username` and `sha256Password`, the latter
 * of which must be a SHA-256 hashed representation of the user's actual password. `undefined` will
 * be returned when no such user exists.
 *
 * @param username The username for the intended account to authenticate against.
 * @param sha256Password The SHA-256 hashed password used to sign in to that account.
 * @returns Undefined when authentication failed, or a pair of the authentication type and the
 *          instance of the `User` class representing this person when successful.
 */
export async function authenticateUserFromPassword(username: string, sha256Password: string)
        : Promise<[ string, User ] | [ undefined, undefined ]> {
    const securelyHashedPassword = await securePasswordHash(sha256Password);
    const result =
        await sql`
            SELECT
                users.*,
                users_auth.auth_type
            FROM
                users
            LEFT JOIN
                users_auth ON users_auth.user_id = users.user_id
            WHERE
                users.username = ${username} AND
                users.activated = 1 AND
                (
                    users_auth.auth_value = ${securelyHashedPassword} AND
                    users_auth.auth_type = 'password'
                ) OR
                (
                    SHA2(users_auth.auth_value, 256) = ${sha256Password} AND
                    users_auth.auth_type = 'code'
                )`;

    if (!result.ok || !result.rows.length)
        return [ undefined, undefined ];

    return [ result.rows[0].auth_type, new User(result.rows[0] as UserDatabaseRow) ];
}

/**
 * Attempts to authenticate the user based on the given `session`. The data contained within the
 * session is assumed to be trustworthy. `undefined` will be returned when no such user exists.
 *
 * @param session The unsealed session information containing the user's information.
 * @returns An instance of the `User` class when successful, `undefined` in all other cases.
 */
export async function authenticateUserFromSession(session: SessionData): Promise<User | undefined> {
    const { id, token } = session;
    const result =
        await sql`SELECT * FROM users WHERE user_id = ${id} AND session_token = ${token}`;

    if (!result.ok || !result.rows.length)
        return undefined;

    return new User(result.rows[0] as UserDatabaseRow);
}

/**
 * Gets the authentication data for the given `username` from the database. A return value of
 * `undefined` means that the user could not be found, whereas every other return value means
 * that the user exists, and possibly registered using a passkey.
 */
export async function getAuthenticationData(username: string)
    : Promise<AuthenticationData | undefined>
{
    const result = await sql`SELECT activated FROM users WHERE username=${username}`;
    if (!result.ok || !result.rows.length)
        return undefined;

    return {
        activated: result.rows[0].activated,
        credentialId: undefined,  // TODO: Support WebAuthn
        publicKey: undefined,  // TODO: Support WebAuthn
    };
}
