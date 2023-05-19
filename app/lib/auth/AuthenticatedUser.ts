// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { IronSession } from 'iron-session';
import { NextResponse } from 'next/server';

import { sql } from '../database';

/**
 * Describes the fields that exist in the `users` table in the database.
 */
interface AuthenticatedUserDatabaseRow {
    user_id: number;
    username: string;
    password: never;
    session_token: number;
}

/**
 * Class representing the user who is signed in based on the current session. Wraps the Iron session
 * and provides convenience
 */
export class AuthenticatedUser {
    private session: IronSession;
    private user: AuthenticatedUserDatabaseRow;

    /**
     * Authenticates the |userId| to the given |session|. Their session token will be determined
     * automatically, and an AuthenticatedUser object will be returned representing their state.
     */
    static async authenticate(session: IronSession, userId: number): Promise<AuthenticatedUser> {
        const result = await sql`SELECT * FROM users WHERE user_id = ${userId}`;
        if (!result.ok || !result.rows.length)
            throw new Error('Unable to authenticate as there was an issue with the database.');

        const authenticatedUser =
            new AuthenticatedUser(session, result.rows[0] as AuthenticatedUserDatabaseRow);

        session.user = {
            id: authenticatedUser.userId,
            token: authenticatedUser.sessionToken,
        };

        await session.save();

        return authenticatedUser;
    }

    /**
     * Attempts to authenticate the user based on the given |session|. Will return an instance of
     * the AuthenticatedUser class when successful, or undefined in all other cases.
     */
    static async tryAuthenticate(session: IronSession): Promise<AuthenticatedUser | undefined> {
        const { id, token } = session.user;
        const result =
            await sql`SELECT * FROM users WHERE user_id = ${id} AND session_token = ${token}`;

        if (!result.ok || !result.rows.length)
            return undefined;

        return new AuthenticatedUser(session, result.rows[0] as AuthenticatedUserDatabaseRow);
    }

    constructor(session: IronSession, user: AuthenticatedUserDatabaseRow) {
        this.session = session;
        this.user = user;
    }

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

    /**
     * Signs the user out of their account. Can only be used when the response has not been sent to
     * the client yet. Optionally redirects the user to the given |redirectUrl|, in which case the
     * returned NextResponse should be returned from the NextJS middleware or handler.
     */
    logout(redirectUrl?: string): NextResponse | undefined {
        this.session.destroy();

        if (redirectUrl)
            return NextResponse.redirect(redirectUrl);
    }
}
