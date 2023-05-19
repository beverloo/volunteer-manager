// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { IronSession } from 'iron-session';
import { NextResponse } from 'next/server';

import { sql } from '../database';

/**
 * Class representing the user who is signed in based on the current session. Wraps the Iron session
 * and provides convenience
 */
export class AuthenticatedUser {
    private session: IronSession;
    username: string;

    /**
     * Attempts to authenticate the user based on the given |session|. Will return an instance of
     * the AuthenticatedUser class when successful, or undefined in all other cases.
     */
    static async tryAuthenticate(session: IronSession): Promise<AuthenticatedUser | undefined> {
        const { id, token } = session.user;
        const result =
            await sql`SELECT * FROM users WHERE user_id = ${id} AND session_token = ${token}`;

        if (!result || !result?.length)
            return undefined;

        return new AuthenticatedUser(session, result[0].username);
    }

    constructor(session: IronSession, username: string) {
        this.session = session;
        this.username = username;
    }

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
