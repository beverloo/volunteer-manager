// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { User } from './User';
import type { UserData } from './UserData';

/**
 * Enumeration of the privileges that can be assigned to individual users. Do not renumber or change
 * the order of these entries, instead, mark them as deprecated and add new ones to the bottom.
 *
 * Next setting: 1 << 16
 */
export enum Privilege {
    Administrator                       = 1 << 0,
    Statistics                          = 1 << 1,

    // Privileges regarding access in the administrative area.
    EventAdministrator                  = 1 << 7,
    SystemAdministrator                 = 1 << 8,
    VolunteerAdministrator              = 1 << 9,

    // Privileges captured by EventAdministrator:
    EventApplicationManagement          = 1 << 10,
    EventContentOverride                = 1 << 2,
    EventHotelManagement                = 1 << 12,
    EventRegistrationOverride           = 1 << 3,
    EventScheduleOverride               = 1 << 4,
    EventTrainingManagement             = 1 << 13,
    EventVolunteerApplicationOverrides  = 1 << 14,
    EventVolunteerContactInfo           = 1 << 11,

    // Privileges captured by SystemAdministrator:
    SystemLogsAccess                    = 1 << 5,

    // Privileges captured by VolunteerAdministrator:
    VolunteerAvatarManagement           = 1 << 6,
    VolunteerSilentMutations            = 1 << 15,
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
export function can(user: User | UserData | undefined, privilege: Privilege): boolean {
    return !!user && (user.privileges & BigInt(privilege)) !== 0n;
}

/**
 * The privilege expansion rules. Certain privileges implicitly grant other privileges, which will
 * be propagated according to the following rules.
 */
const PrivilegeExpansion: { [key in Privilege]?: Privilege[] } = {
    [Privilege.Administrator]: [
        Privilege.EventAdministrator,
        Privilege.SystemAdministrator,
        Privilege.VolunteerAdministrator,
        Privilege.Statistics,
    ],

    [Privilege.EventAdministrator]: [
        Privilege.EventApplicationManagement,
        Privilege.EventContentOverride,
        Privilege.EventHotelManagement,
        Privilege.EventRegistrationOverride,
        Privilege.EventScheduleOverride,
        Privilege.EventTrainingManagement,
        Privilege.EventVolunteerApplicationOverrides,
        Privilege.EventVolunteerContactInfo,
    ],

    [Privilege.SystemAdministrator]: [
        Privilege.SystemLogsAccess,
    ],

    [Privilege.VolunteerAdministrator]: [
        Privilege.VolunteerAvatarManagement,
        Privilege.VolunteerSilentMutations,
    ],
};

/**
 * Maximum depth of privilege expansion rules. I.e. Administrator -> EventAdministrator ->
 * EventApplicationManagement makes for two necessary iterations.
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
    [Privilege.Statistics]: 'Special access',

    [Privilege.EventAdministrator]: 'Special access',
    [Privilege.EventApplicationManagement]: 'Event access',
    [Privilege.EventContentOverride]: 'Event access',
    [Privilege.EventHotelManagement]: 'Event access',
    [Privilege.EventRegistrationOverride]: 'Event access',
    [Privilege.EventScheduleOverride]: 'Event access',
    [Privilege.EventTrainingManagement]: 'Event access',
    [Privilege.EventVolunteerApplicationOverrides]: 'Event access',
    [Privilege.EventVolunteerContactInfo]: 'Event access',

    [Privilege.SystemAdministrator]: 'Special access',
    [Privilege.SystemLogsAccess]: 'System access',

    [Privilege.VolunteerAdministrator]: 'Special access',
    [Privilege.VolunteerAvatarManagement]: 'Volunteer access',
    [Privilege.VolunteerSilentMutations]: 'Volunteer access',
};

/**
 * Names of each of the privileges.
 */
export const PrivilegeNames: { [key in Privilege]: string } = {
    [Privilege.Administrator]: 'Administrator',
    [Privilege.Statistics]: 'Statistics',

    [Privilege.EventAdministrator]: 'Event administrator',
    [Privilege.EventApplicationManagement]: 'Manage applications',
    [Privilege.EventContentOverride]: 'Always allow access to event content',
    [Privilege.EventHotelManagement]: 'Manage hotel rooms',
    [Privilege.EventRegistrationOverride]: 'Always allow access to event registration',
    [Privilege.EventScheduleOverride]: 'Always allow access to the volunteer portal',
    [Privilege.EventTrainingManagement]: 'Manage trainings',
    [Privilege.EventVolunteerApplicationOverrides]: 'Manage application overrides',
    [Privilege.EventVolunteerContactInfo]: 'Always show volunteer contact info',

    [Privilege.SystemAdministrator]: 'System administrator',
    [Privilege.SystemLogsAccess]: 'Logs access',

    [Privilege.VolunteerAdministrator]: 'Volunteer administrator',
    [Privilege.VolunteerAvatarManagement]: 'Avatar management',
    [Privilege.VolunteerSilentMutations]: 'Silent changes',
};

/**
 * Warnings associated with each of the Privileges.
 */
export const PrivilegeWarnings: { [key in Privilege]?: string } = {
    [Privilege.Administrator]: 'Grants all privileges',

    [Privilege.EventAdministrator]: 'Grants all event-related privileges',
    [Privilege.SystemAdministrator]: 'Grants all system-related privileges',
    [Privilege.VolunteerAdministrator]: 'Grants all volunteer-related privileges',

    [Privilege.VolunteerSilentMutations]: 'Make changes without informing the volunteer',
};
