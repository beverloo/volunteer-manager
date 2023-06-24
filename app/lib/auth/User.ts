// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { Privilege } from './Privileges';
import { type SessionData } from './Session';
import { type UserData } from './UserData';
import { sql } from '../database';

/**
 * Fetches authentication data for a particular user. Will be relayed to the frontend allowing them
 * to sign in to their account, preferably using passkeys.
 */
interface AuthenticationData {
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
 * Data that needs to be made available for a password reset request for a particular user. This
 * information is considered sensitive and should only be shared with the included e-mail address.
 */
interface PasswordResetData {
    /**
     * The user's unique Id as stored in the database.
     */
    userId: number;

    /**
     * The user's e-mail address with which this information can be shared.
     */
    emailAddress: string;

    /**
     * The user's current session token, instrumental to allowing password reset.
     */
    sessionToken: number;
}

/**
 * Describes the fields that exist in the `users` table in the database.
 */
interface UserDatabaseRow {
    user_id: number;
    username: string;
    first_name: string;
    last_name: string;
    gender: string;
    birthdate: string;  // YYYY-MM-DD
    phone_number: string;
    privileges: number;
    session_token: number;
}

/**
 * Class representing the user who is signed in based on the current session. An instance of the
 * User class can only be used by server components, which is a superset of the UserData interface
 * that can also be made available to client components. Such an object can be obtained by calling
 * the User.prototype.toUserData() method.
 */
export class User implements UserData {
    /**
     * Attempts to authenticate the user based on the given |username| and |password|. Will return
     * a User instance when successful, or undefined in all other cases.
     */
    static async authenticateFromPassword(username: string, password: string)
            : Promise<User | undefined> {
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
                    users_auth.auth_value = ${password}`;

        if (!result.ok || !result.rows.length)
            return undefined;

        return new User(result.rows[0] as UserDatabaseRow);
    }

    /**
     * Attempts to authenticate the user based on the given |session|. Will return a User instance
     * when successful, or undefined in all other cases.
     */
    static async authenticateFromSession(session: SessionData): Promise<User | undefined> {
        const { id, token } = session;
        const result =
            await sql`SELECT * FROM users WHERE user_id = ${id} AND session_token = ${token}`;

        if (!result.ok || !result.rows.length)
            return undefined;

        return new User(result.rows[0] as UserDatabaseRow);
    }

    /**
     * Gets the authentication data for the given |username| from the database. A return value of
     * `undefined` means that the user could not be found, whereas every other return value means
     * that the user exists, and possibly registered using a passkey.
     */
    static async getAuthenticationData(username: string): Promise<AuthenticationData | undefined> {
        const result =
            await sql`SELECT user_id FROM users WHERE username=${username}`;

        if (!result.ok || !result.rows.length)
            return undefined;

        return { /* TODO: Credential information for passkeys */ };
    }

    /**
     * Gets the information required in order to reset the password of the given |username|. This
     * method does not require further authentication, and should be considered sensitive.
     */
    static async getPasswordResetData(username: string): Promise<PasswordResetData | undefined> {
        const result =
            await sql`
                SELECT
                    users.user_id AS userId,
                    users.username AS emailAddress,
                    users.session_token AS sessionToken
                FROM
                    users
                WHERE
                    users.username = ${username}`;

        if (!result.ok || !result.rows.length)
            return undefined;

        return result.rows[0] as PasswordResetData;
    }

    // ---------------------------------------------------------------------------------------------

    #user: UserDatabaseRow;

    constructor(user: UserDatabaseRow) {
        this.#user = user;
    }

    // ---------------------------------------------------------------------------------------------
    // Functionality limited to server components:
    // ---------------------------------------------------------------------------------------------

    /**
     * Returns whether the user is allowed to use the given |privilege|.
     */
    can(privilege: Privilege): boolean {
        return (this.#user.privileges & Privilege.Administrator) !== 0 ||
               (this.#user.privileges & privilege) !== 0;
    }

    /**
     * Unique, automatically incrementing user ID assigned to this user.
     */
    get userId() { return this.#user.user_id; }

    /**
     * Returns the user's gender, which is a string with arbitrary value.
     */
    get gender() { return this.#user.gender; }

    /**
     * Returns the user's birth date as a YYYY-MM-DD string.
     */
    get birthDate() { return this.#user.birthdate; }

    /**
     * Returns the user's phone number, including their country code.
     */
    get phoneNumber() { return this.#user.phone_number; }

    /**
     * The user's current session token. Must match the token given in the Iron Session.
     */
    get sessionToken() { return this.#user.session_token; }

    // ---------------------------------------------------------------------------------------------
    // Functionality also available to client components, i.e. UserData implementation:
    // ---------------------------------------------------------------------------------------------

    get firstName() { return this.#user.first_name; }
    get lastName() { return this.#user.last_name; }
    get privileges() { return this.#user.privileges; }
    get username() { return this.#user.username; }

    // ---------------------------------------------------------------------------------------------
    // Functionality to obtain a plain UserData object:
    // ---------------------------------------------------------------------------------------------

    /**
     * Returns a plain JavaScript object that conforms to the UserData interface.
     */
    toUserData(): UserData {
        return {
            firstName: this.firstName,
            lastName: this.lastName,
            privileges: this.privileges,
            username: this.username,
        };
    }
}
