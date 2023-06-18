// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type User } from './User';
import { type UserData } from './UserData';

/**
 * Enumeration of the privileges that can be assigned to individual users. Do not renumber or change
 * the order of these entries, instead, mark them as deprecated and add new ones to the bottom.
 */
export enum Privilege {
    Administrator       = 1 << 0,
    Statistics          = 1 << 1,
    ShowPastEvents      = 1 << 2,
    ShowFutureEvents    = 1 << 3,
};

/**
 * Type definition for multiple privileges. They are stored as a singular integer in which each of
 * the privileges is represented by a singular bit.
 */
export type Privileges = number;

/**
 * Returns whether the given |user| has been granted the given |privilege|. No need for null-checks
 * as the |user| argument can be considered optional, any falsy value will fall back to defaults.
 */
export function can(user: User | UserData | undefined, privilege: Privilege): boolean {
    if (!user)
        return false;  // TODO: Default, non-zero privileges?

    return (user.privileges & Privilege.Administrator) !== 0 ||
           (user.privileges & privilege) !== 0;
}

/**
 * Names of each of the privileges.
 */
export const PrivilegeNames: { [key in Privilege]: string } = {
    [Privilege.Administrator]: 'Administrator',
    [Privilege.Statistics]: 'Statistics',
    [Privilege.ShowPastEvents]: 'Show past events',
    [Privilege.ShowFutureEvents]: 'Show future events',
};

/**
 * Warnings associated with each of the Privileges.
 */
export const PrivilegeWarnings: { [key in Privilege]?: string } = {
    [Privilege.Administrator]: 'Administrator privilege automatically grants all other privileges',
    [Privilege.Statistics]: 'Allows access to (aggregated) statistics across all events',
};
