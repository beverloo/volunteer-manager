// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { AuthType } from '../database/Types';

/**
 * Interface describing the information we maintain on an individual user. Instances of these
 * objects can be obtained through the `authenticateUser()` function. Tests may mimic their own
 * users, but be sure to type it correctly to avoid unexpected breakages.
 */
export interface internal_User {
    /**
     * Unique ID of the user, as they are represented in the database.
     */
    userId: number;

    /**
     * The username of this user, generally their e-mail address. There exist users in the system
     * for whom no e-mail address (& thus username) is on record.
     */
    username?: string;

    /**
     * The first name of this user.
     */
    firstName: string;

    /**
     * The last name of this user.
     */
    lastName: string;

    /**
     * URL using which this user's avatar can be retrieved.
     */
    avatarUrl?: string;

    /**
     * The privileges the user has access to, fresh from the database for the current request. The
     * privileges will have been expanded already.
     */
    privileges: bigint;

    // ---------------------------------------------------------------------------------------------
    // TODO: Remove the following fields
    // ---------------------------------------------------------------------------------------------

    /**
     * Returns the type of authentication mechanism that was used to sign this user in. Only
     * available when the instance was created from a access code, password or passkey credential.
     */
    authTypeForCredentialBasedAuthentication: AuthType;

    /**
     * Events that the user has been accepted in to, and some metainformation about these events.
     */
    events: {
        /**
         * ID of the event that they participated in.
         */
        eventId: number;

        /**
         * ID of the team that the user is part of.
         */
        teamId: number;

        /**
         * Whether the user has admin access to this event, granted by their role.
         */
        adminAccess: boolean;

        /**
         * Whether the event is hidden from display, for example because it's too old.
         */
        hidden: boolean;
    }[],

    /**
     * The user's current session token. Must match the token given in the Iron Session.
     */
    sessionToken: number;
}

// -------------------------------------------------------------------------------------------------

import type { UserData } from './UserData';

/**
 * Describes the fields that exist in the `users` table in the database.
 */
export type UserDatabaseRow = internal_User;

/**
 * Class representing the user who is signed in based on the current session. An instance of the
 * User class can only be used by server components, which is a superset of the UserData interface
 * that can also be made available to client components. Such an object can be obtained by calling
 * the User.prototype.toUserData() method.
 */
export class User implements UserData {
    #user: internal_User;

    constructor(user: internal_User) {
        this.#user = user;
    }

    // ---------------------------------------------------------------------------------------------
    // internal_User
    // ---------------------------------------------------------------------------------------------

    get userId() { return this.#user.userId; }
    get username() { return this.#user.username; }
    get firstName() { return this.#user.firstName; }
    get lastName() { return this.#user.lastName; }
    get avatarUrl() { return this.#user.avatarUrl; }
    get privileges() { return this.#user.privileges; }

    get authTypeForCredentialBasedAuthentication() {
        return this.#user.authTypeForCredentialBasedAuthentication;
    }

    get events() { return this.#user.events; }
    get sessionToken() { return this.#user.sessionToken; }

    // ---------------------------------------------------------------------------------------------
    // Functionality to obtain a plain UserData object:
    // ---------------------------------------------------------------------------------------------

    /**
     * Returns a plain JavaScript object that conforms to the UserData interface.
     */
    toUserData(): UserData {
        return {
            avatarUrl: this.avatarUrl,
            events: this.events,
            firstName: this.firstName,
            lastName: this.lastName,
            privileges: this.privileges,
            username: this.username,
        };
    }
}
