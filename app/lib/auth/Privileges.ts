// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { User } from './User';

/**
 * Enumeration of the privileges that can be assigned to individual users. Do not renumber or change
 * the order of these entries, instead, mark them as deprecated and add new ones to the bottom.
 *
 * Next setting: 1 << 32
 */
export enum Privilege {
    Administrator                       = 1 << 0,
    EventAdministrator                  = 1 << 7,
};

/**
 * Type definition for multiple privileges. They are stored as a singular integer in which each of
 * the privileges is represented by a singular bit.
 */
export type Privileges = bigint;

/**
 * Returns whether the given |user| has been granted the given |privilege|. No need for null-checks
 * as the |user| argument can be considered optional, any falsy value will fall back to defaults.
 */
export function can(user: Privileges | User | undefined, privilege: Privilege): boolean {
    if (typeof user === 'bigint')
        return (user & BigInt(privilege)) !== 0n;

    return !!user && (user.privileges & BigInt(privilege)) !== 0n;
}

/**
 * The privilege expansion rules. Certain privileges implicitly grant other privileges, which will
 * be propagated according to the following rules.
 */
const PrivilegeExpansion: { [key in Privilege]?: Privilege[] } = {
    [Privilege.Administrator]: [
        Privilege.EventAdministrator,
    ],
};

/**
 * Maximum depth of privilege expansion rules. I.e. Administrator -> EventAdministrator ->
 * EventExamplePermission makes for two necessary iterations.
 */
const kPrivilegeExpansionIterations = 2;

/**
 * Expands the `privileges` according to the privilege expansion rules.
 */
export function expand(privileges: Privileges): Privileges {
    for (let iteration = 0; iteration < kPrivilegeExpansionIterations; ++iteration) {
        for (const [ privilege, expandedPrivileges ] of Object.entries(PrivilegeExpansion)) {
            if ((privileges & BigInt(privilege)) === 0n)
                continue;  // the |privilege| has not been granted

            for (const expandedPrivilege of expandedPrivileges)
                privileges |= BigInt(expandedPrivilege);
        }
    }

    return privileges;
}

/**
 * Grouping of the privileges as they should be rendered in the administrative area
 */
export const PrivilegeGroups: { [key in Privilege]: string } = {
    [Privilege.Administrator]: 'Special access',

    [Privilege.EventAdministrator]: 'Special access',
};

/**
 * Names of each of the privileges.
 */
export const PrivilegeNames: { [key in Privilege]: string } = {
    [Privilege.Administrator]: 'Administrator',

    [Privilege.EventAdministrator]: 'Event administrator',
};

/**
 * Warnings associated with each of the Privileges.
 */
export const PrivilegeWarnings: { [key in Privilege]?: string } = {
    [Privilege.Administrator]: 'Grants all privileges',

    [Privilege.EventAdministrator]: 'Grants all event-related privileges',
};
