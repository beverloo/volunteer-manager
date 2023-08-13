// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type User } from './User';
import { type UserData } from './UserData';

/**
 * Enumeration of the privileges that can be assigned to individual users. Do not renumber or change
 * the order of these entries, instead, mark them as deprecated and add new ones to the bottom.
 */
export enum Privilege {
    Administrator               = 1 << 0,
    Statistics                  = 1 << 1,

    // Privileges regarding the visibility and accessibility of events.
    EventContentOverride        = 1 << 2,
    EventRegistrationOverride   = 1 << 3,
    EventScheduleOverride       = 1 << 4,

    // Privileges regarding functionality on the volunteer manager.
    ReplaceOwnAvatar            = 1 << 5,
    ReplaceAnyAvatar            = 1 << 6,

    // Privileges regarding access in the administrative area.
    EventAdministrator          = 1 << 7,
    SystemAdministrator         = 1 << 8,
    VolunteerAdministrator      = 1 << 9,
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
 * Grouping of the privileges as they should be rendered in the administrative area
 */
export const PrivilegeGroups: { [key in Privilege]: string } = {
    [Privilege.Administrator]: 'Special access',
    [Privilege.Statistics]: 'Special access',
    [Privilege.EventContentOverride]: 'Event access',
    [Privilege.EventRegistrationOverride]: 'Event access',
    [Privilege.EventScheduleOverride]: 'Event access',
    [Privilege.ReplaceOwnAvatar]: 'Volunteer access',
    [Privilege.ReplaceAnyAvatar]: 'Volunteer access',
    [Privilege.EventAdministrator]: 'Special access',
    [Privilege.SystemAdministrator]: 'Special access',
    [Privilege.VolunteerAdministrator]: 'Special access',
};

/**
 * Names of each of the privileges.
 */
export const PrivilegeNames: { [key in Privilege]: string } = {
    [Privilege.Administrator]: 'Administrator',
    [Privilege.Statistics]: 'Statistics',
    [Privilege.EventContentOverride]: 'Always allow access to event content',
    [Privilege.EventRegistrationOverride]: 'Always allow access to event registration',
    [Privilege.EventScheduleOverride]: 'Always allow access to the volunteer portal',
    [Privilege.ReplaceOwnAvatar]: 'Replace own avatar',
    [Privilege.ReplaceAnyAvatar]: 'Replace anyone\'s avatar',
    [Privilege.EventAdministrator]: 'Event administrator',
    [Privilege.SystemAdministrator]: 'System administrator',
    [Privilege.VolunteerAdministrator]: 'Volunteer administrator',
};

/**
 * Warnings associated with each of the Privileges.
 */
export const PrivilegeWarnings: { [key in Privilege]?: string } = {
    [Privilege.Administrator]: 'Automatically grants all other privileges',
    [Privilege.Statistics]: 'Allows access to (aggregated) statistics across all events',
    [Privilege.ReplaceAnyAvatar]: 'That includes your avatar as well…',
    [Privilege.EventAdministrator]: 'Administrator access to anything related to events',
    [Privilege.SystemAdministrator]: 'Administrator access to anything regarding system internals',
    [Privilege.VolunteerAdministrator]: 'Administrator access to anything related to volunteers',
};
