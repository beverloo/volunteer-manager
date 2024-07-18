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
    Feedback                            = 1 << 1,  // TODO: Assign to its own privilege
    Refunds                             = 1 << 23,
    Statistics                          = 1 << 1,

    // Privileges regarding access in the administrative area.
    EventAdministrator                  = 1 << 7,
    SystemAdministrator                 = 1 << 8,
    VolunteerAdministrator              = 1 << 9,

    // Privileges captured by EventAdministrator:
    EventApplicationOverride            = 1 << 3,
    EventContentOverride                = 1 << 2,
    EventHelpRequests                   = 1 << 30,
    EventHotelManagement                = 1 << 12,
    EventScheduleManagement             = 1 << 29,
    EventScheduleOverride               = 1 << 4,
    EventShiftManagement                = 1 << 26,
    EventTrainingManagement             = 1 << 13,
    EventVolunteerApplicationOverrides  = 1 << 14,
    EventVolunteerContactInfo           = 1 << 11,

    // Privileges captured by SystemAdministrator:
    SystemOutboxAccess                  = 1 << 17,
    SystemSubscriptionEligible          = 1 << 28,
    SystemSubscriptionManagement        = 1 << 24,
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
        Privilege.SystemAdministrator,
        Privilege.VolunteerAdministrator,
        Privilege.Feedback,
        Privilege.Refunds,
        Privilege.Statistics,
    ],

    [Privilege.EventAdministrator]: [
        Privilege.EventApplicationOverride,
        Privilege.EventContentOverride,
        Privilege.EventHelpRequests,
        Privilege.EventHotelManagement,
        Privilege.EventScheduleManagement,
        Privilege.EventScheduleOverride,
        Privilege.EventShiftManagement,
        Privilege.EventTrainingManagement,
        Privilege.EventVolunteerApplicationOverrides,
        Privilege.EventVolunteerContactInfo,
    ],

    [Privilege.SystemAdministrator]: [
        Privilege.SystemOutboxAccess,
        Privilege.SystemSubscriptionEligible,
        Privilege.SystemSubscriptionManagement,
    ],
};

/**
 * Maximum depth of privilege expansion rules. I.e. Administrator -> EventAdministrator ->
 * EventVolunteerContactInfo makes for two necessary iterations.
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
    [Privilege.Feedback]: 'Special access',
    [Privilege.Refunds]: 'Special access',
    //[Privilege.Statistics]: 'Special access',

    [Privilege.EventAdministrator]: 'Special access',
    [Privilege.EventApplicationOverride]: 'Event access',
    [Privilege.EventContentOverride]: 'Event access',
    [Privilege.EventHelpRequests]: 'Event access',
    [Privilege.EventHotelManagement]: 'Event access',
    [Privilege.EventScheduleManagement]: 'Event access',
    [Privilege.EventScheduleOverride]: 'Event access',
    [Privilege.EventShiftManagement]: 'Event access',
    [Privilege.EventTrainingManagement]: 'Event access',
    [Privilege.EventVolunteerApplicationOverrides]: 'Event access',
    [Privilege.EventVolunteerContactInfo]: 'Event access',

    [Privilege.SystemAdministrator]: 'Special access',
    [Privilege.SystemOutboxAccess]: 'System access',
    [Privilege.SystemSubscriptionEligible]: 'System access',
    [Privilege.SystemSubscriptionManagement]: 'System access',

    [Privilege.VolunteerAdministrator]: 'Special access',
};

/**
 * Names of each of the privileges.
 */
export const PrivilegeNames: { [key in Privilege]: string } = {
    [Privilege.Administrator]: 'Administrator',
    [Privilege.Feedback]: 'Feedback tool',
    [Privilege.Refunds]: 'Refund requests',
    //[Privilege.Statistics]: 'Statistics',

    [Privilege.EventAdministrator]: 'Event administrator',
    [Privilege.EventApplicationOverride]: 'Always accept their applications',
    [Privilege.EventContentOverride]: 'Always allow access to event content',
    [Privilege.EventHelpRequests]: 'Help requests',
    [Privilege.EventHotelManagement]: 'Manage hotel rooms',
    [Privilege.EventScheduleManagement]: 'Manage schedules',
    [Privilege.EventScheduleOverride]: 'Always allow access to the volunteer portal',
    [Privilege.EventShiftManagement]: 'Manage shifts',
    [Privilege.EventTrainingManagement]: 'Manage trainings',
    [Privilege.EventVolunteerApplicationOverrides]: 'Manage application overrides',
    [Privilege.EventVolunteerContactInfo]: 'Always show volunteer contact info',

    [Privilege.SystemAdministrator]: 'System administrator',
    [Privilege.SystemOutboxAccess]: 'Outbox access',
    [Privilege.SystemSubscriptionEligible]: 'Subscription eligibility',
    [Privilege.SystemSubscriptionManagement]: 'Subscription management',

    [Privilege.VolunteerAdministrator]: 'Volunteer administrator',
};

/**
 * Warnings associated with each of the Privileges.
 */
export const PrivilegeWarnings: { [key in Privilege]?: string } = {
    [Privilege.Administrator]: 'Grants all privileges',

    [Privilege.Refunds]: 'Grants access to financial information',

    [Privilege.EventAdministrator]: 'Grants all event-related privileges',
    [Privilege.SystemAdministrator]: 'Grants all system-related privileges',

    [Privilege.EventHelpRequests]: 'Grants access to incoming help requests',

    [Privilege.SystemOutboxAccess]: 'Access to all sent messages and their content',
    [Privilege.SystemSubscriptionManagement]: 'Access to modify anyone\'s subscriptions',
};
