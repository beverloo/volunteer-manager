// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type SessionData } from './Session';
import { type UserDatabaseRow, User } from './User';

import { securePasswordHash } from './Password';
import { sql } from '../database';

/**
 * Attempts to authenticate the user based on the given `username` and `sha256Password`, the latter
 * of which must be a SHA-256 hashed representation of the user's actual password. `undefined` will
 * be returned when no such user exists.
 *
 * @param username The username for the intended account to authenticate against.
 * @param sha256Password The SHA-256 hashed password used to sign in to that account.
 * @returns An instance of the `User` class when successful, `undefined` in all other cases.
 */
export async function authenticateUserFromPassword(username: string, sha256Password: string)
        : Promise<User | undefined> {
    const securelyHashedPassword = await securePasswordHash(sha256Password);
    const result =
        await sql`
            SELECT
                users.*
            FROM
                users
            LEFT JOIN
                users_auth ON users_auth.user_id = users.user_id AND
                                users_auth.auth_type = 'password'
            WHERE
                users.username = ${username} AND
                users_auth.auth_value = ${securelyHashedPassword}`;

    if (!result.ok || !result.rows.length)
        return undefined;

    return new User(result.rows[0] as UserDatabaseRow);
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
