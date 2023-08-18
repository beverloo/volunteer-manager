// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type SessionData } from './Session';
import { type UserDatabaseRow, User } from './User';

import { securePasswordHash } from './Password';
import db, { sql, tUsers } from '../database';

/**
 * Fetches authentication data for a particular user. Will be relayed to the frontend allowing them
 * to sign in to their account, preferably using passkeys.
 */
interface AuthenticationData {
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
 * Interface containing all the information that must be known when creating a new account.
 */
interface AccountCreationData {
    /**
     * The username of the account that should be created.
     */
    username: string;

    /**
     * The password associated with that account, SHA256 hashed.
     */
    password: string;

    /**
     * The user's first name.
     */
    firstName: string;

    /**
     * The user's last name.
     */
    lastName: string;

    /**
     * Gender of the user. A string because we don't care.
     */
    gender: string;

    /**
     * Date on which the user was born. (YYYY-MM-DD)
     */
    birthdate: string;

    /**
     * Phone number of the user, in an undefined format.
     */
    phoneNumber: string;
}

/**
 * Activates the account with the given `userId`. The account must not have been activated yet. Will
 * return an instance of the User class when successful, or undefined when a failure occurred.
 */
export async function activateAccount(userId: number): Promise<User | undefined> {
    const confirmation = await db.selectFrom(tUsers)
        .where(tUsers.userId.equals(userId))
        .select({
            activated: tUsers.activated,
            sessionToken: tUsers.sessionToken,
        })
        .executeSelectNoneOrOne();

    if (!confirmation || !!confirmation.activated)
        return undefined;  // unknown user, or the account is already activated

    const affectedRows = await db.update(tUsers)
        .set({ activated: 1 })
        .where(tUsers.userId.equals(userId))
        .executeUpdate(/* min= */ 0, /* max= */ 1);

    if (!affectedRows)
        return undefined;  // the account could not be activated

    return authenticateUserFromSession({
        id: userId,
        token: confirmation.sessionToken,
    });
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
                users_auth.auth_type,
                storage.file_hash AS avatar_file_hash
            FROM
                users
            LEFT JOIN
                users_auth ON users_auth.user_id = users.user_id
            LEFT JOIN
                storage ON storage.file_id = users.avatar_id
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
        await sql`
            SELECT
                users.*,
                storage.file_hash AS avatar_file_hash
            FROM
                users
            LEFT JOIN
                storage ON storage.file_id = users.avatar_id
            WHERE
                users.user_id = ${id} AND
                users.session_token = ${token}`;

    if (!result.ok || !result.rows.length)
        return undefined;

    return new User(result.rows[0] as UserDatabaseRow);
}

/**
 * Creates an account based on the given `data`. Will return a number indicating user ID when the
 * account was created successfully, or undefined. Failure only happens when the SQL queries fail.
 */
export async function createAccount(data: AccountCreationData): Promise<undefined | number> {
    const userTableResult =
        await sql`
            INSERT INTO
                users
                (username, first_name, last_name, gender, birthdate, phone_number)
            VALUES
                (${data.username}, ${data.firstName}, ${data.lastName}, ${data.gender},
                 ${data.birthdate}, ${data.phoneNumber})`;

    if (!userTableResult.ok || !userTableResult.insertId) {
        console.error('Unable to write into the users table:', userTableResult.error);
        return undefined;
    }

    const securelyHashedPassword = await securePasswordHash(data.password);
    const userId = userTableResult.insertId;

    const authenticationTableResult =
        await sql`
            INSERT INTO
                users_auth
                (user_id, auth_type, auth_value)
            VALUES
                (${userId}, "password", ${securelyHashedPassword})`;

    if (!authenticationTableResult.ok) {
        console.error('Unable to write in the users_auth table:', authenticationTableResult.error);
        return undefined;
    }

    return userId;
}

/**
 * Gets the authentication data for the given `username` from the database. A return value of
 * `undefined` means that the user could not be found, whereas every other return value means
 * that the user exists, and possibly registered using a passkey.
 */
export async function getAuthenticationData(username: string)
    : Promise<AuthenticationData | undefined>
{
    const user = await db.selectFrom(tUsers)
        .select({ activated: tUsers.activated })
        .where(tUsers.username.equals(username))
        .executeSelectNoneOrOne();

    if (!user)
        return undefined;

    return {
        activated: !!user.activated,
        credentialId: undefined,  // TODO: Support WebAuthn
        publicKey: undefined,  // TODO: Support WebAuthn
    };
}

/**
 * Returns whether the given `username` is available.
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
    const user = await db.selectFrom(tUsers)
        .select({ userId: tUsers.userId })
        .where(tUsers.username.equals(username))
        .executeSelectNoneOrOne();

    return !user;
}
