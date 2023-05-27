// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { Privilege } from './Privileges';
import { Session } from './Session';
import { sql } from '../database';

/**
 * Describes the fields that exist in the `users` table in the database.
 */
interface UserDatabaseRow {
    user_id: number;
    username: string;
    password: never;
    session_token: number;
}

/**
 * Class representing the user who is signed in based on the current session. Wraps the Iron session
 * and provides convenience
 */
export class User {
    private user: UserDatabaseRow;

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
        this.user = user;
    }

    /**
     * The privileges the user has access to, fresh from the database for the current request.
     */
    get privileges() { return [ Privilege.Foo, Privilege.Bar ]; }

    /**
     * Unique, automatically incrementing user ID assigned to this user.
     */
    get userId() { return this.user.user_id; }

    /**
     * The username of this user, generally their e-mail address.
     */
    get username() { return this.user.username; }

    /**
     * The user's current session token. Must match the token given in the Iron Session.
     */
    get sessionToken() { return this.user.session_token; }
}
