// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type UserData } from './UserData';

import { getAvatarUrl } from '../database/AvatarStore';
import { securePasswordHash } from './Password';
import db, { sql, tUsers } from '../database';

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
     * The user's current session token, instrumental to allowing password reset.
     */
    sessionToken: number;

    /**
     * First name of the person who requested their password to be reset.
     */
    firstName: string;
}

/**
 * Describes the fields that exist in the `users` table in the database.
 */
export interface UserDatabaseRow {
    user_id: number;
    username: string;
    first_name: string;
    last_name: string;
    gender: string;
    birthdate: string;  // YYYY-MM-DD
    phone_number: string;
    avatar_file_hash?: string;
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
     * Gets the information required in order to reset the password of the given |username|. This
     * method does not require further authentication, and should be considered sensitive.
     */
    static async getPasswordResetData(username: string): Promise<PasswordResetData | undefined> {
        return await db.selectFrom(tUsers)
            .where(tUsers.username.equals(username))
            .select({
                userId: tUsers.userId,
                sessionToken: tUsers.sessionToken,
                firstName: tUsers.firstName,
            })
            .executeSelectNoneOrOne() ?? undefined;
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
     * Update the user's password to the given |hashedPassword|, which already should be a SHA-256
     * hashed representation. Optionally the session token can be incremented as well, which will
     * invalidate all other existing sessions.
     *
     * @param hashedPassword SHA-256 representation of the user's new password.
     * @param incrementSessionToken Whether the session token should be incremented.
     */
    async updatePassword(hashedPassword: string, incrementSessionToken?: boolean): Promise<void> {
        const securelyHashedPassword = await securePasswordHash(hashedPassword);
        const queries = [
            // (1) Delete all old passwords, which should no longer be valid.
            sql`
                DELETE FROM
                    users_auth
                WHERE
                    user_id=${this.#user.user_id} AND
                    auth_type IN ("code", "password")`,

            // (2) Store the new password in the authentication table.
            sql`
                INSERT INTO
                    users_auth
                    (user_id, auth_type, auth_value)
                VALUES
                    (${this.#user.user_id}, "password", ${securelyHashedPassword})`,
        ];

        if (incrementSessionToken) {
            queries.push(
                // (3) Increment the user's session token, invalidating all other sessions.
                sql`
                    UPDATE
                        users
                    SET
                        session_token=${++this.#user.session_token}
                    WHERE
                        user_id=${this.#user.user_id}`);
        }

        await Promise.all(queries);
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
    get avatarUrl() { return getAvatarUrl(this.#user.avatar_file_hash); }
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
            avatarUrl: this.avatarUrl,
            privileges: this.privileges,
            username: this.username,
        };
    }
}
