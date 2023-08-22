// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type UserData } from './UserData';

import { AuthType } from '../database/Types';
import { expand } from './Privileges';
import { getAvatarUrl } from '../database/AvatarStore';
import { securePasswordHash } from './Password';
import db, { tUsers, tUsersAuth } from '../database';

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

    #privileges: bigint;
    #user: UserDatabaseRow;

    constructor(user: UserDatabaseRow) {
        this.#privileges = expand(BigInt(user.privileges));
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

        const dbInstance = db;
        await dbInstance.transaction(async () => {
            // (1) Delete all old passwords, which should no longer be valid.
            await dbInstance.deleteFrom(tUsersAuth)
                .where(tUsersAuth.userId.equals(this.#user.user_id))
                    .and(tUsersAuth.authType.in([ AuthType.code, AuthType.password ]))
                .executeDelete();

            // (2) Store the new password in the authentication table.
            await dbInstance.insertInto(tUsersAuth)
                .values({
                    userId: this.#user.user_id,
                    authType: AuthType.password,
                    authValue: securelyHashedPassword
                })
                .executeInsert(/* min= */ 0, /* max= */ 1);

            // (3) Increment the user's session token, invalidating all other sessions.
            await dbInstance.update(tUsers)
                .set({ sessionToken: this.#user.session_token + 1 })
                .where(tUsers.userId.equals(this.#user.user_id))
                .executeUpdate(/* min= */ 0, /* max= */ 1);
        });
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
    get privileges() { return this.#privileges; }
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
