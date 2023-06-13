// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { Privilege } from './Privileges';
import { Session } from './Session';
import { type UserData } from './UserData';
import { sql } from '../database';

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
    #user: UserDatabaseRow;

    /**
     * Attempts to authenticate the user based on the given |session|. Will return a User instance
     * when successful, or undefined in all other cases.
     */
    static async authenticateFromSession(session: Session): Promise<User | undefined> {
        const { id, token } = session;
        const result =
            await sql`SELECT * FROM users WHERE user_id = ${id} AND session_token = ${token}`;

        if (!result.ok || !result.rows.length)
            return undefined;

        return new User(result.rows[0] as UserDatabaseRow);
    }

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
