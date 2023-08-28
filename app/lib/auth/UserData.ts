// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

/**
 * Object that represents the user data transferrable to the client-side. This should omit personal
 * information that isn't commonly needed; pass those as separate props.
 */
export interface UserData {
    /**
     * URL using which this user's avatar can be retrieved.
     */
    avatarUrl?: string;

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
     * The first name of this user.
     */
    firstName: string;

    /**
     * The last name of this user.
     */
    lastName: string;

    /**
     * The privileges the user has access to, fresh from the database for the current request.
     */
    privileges: bigint;

    /**
     * The username of this user, generally their e-mail address. There exist users in the system
     * for whom no e-mail address (& thus username) is on record.
     */
    username?: string;
}
