// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

/**
 * Interface describing the information we maintain on an individual user. Instances of these
 * objects can be obtained through the `authenticateUser()` function. Tests may mimic their own
 * users, but be sure to type it correctly to avoid unexpected breakages.
 */
export interface User {
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
}
