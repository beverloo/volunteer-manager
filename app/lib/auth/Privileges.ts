// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { User } from './User';

/**
 * Enumeration of the privileges that can be assigned to individual users. Do not renumber or change
 * the order of these entries, instead, mark them as deprecated and add new ones to the bottom.
 *
 * Next setting: 1 << 31
 */
export enum Privilege {
    Administrator                       = 1 << 0,
    Refunds                             = 1 << 23,
    Statistics                          = 1 << 1,

    // Privileges regarding access in the administrative area.
    EventAdministrator                  = 1 << 7,
    SystemAdministrator                 = 1 << 8,
    VolunteerAdministrator              = 1 << 9,

    // Privileges captured by EventAdministrator:
    EventApplicationManagement          = 1 << 10,
    EventContentOverride                = 1 << 2,
    EventHelpRequests                   = 1 << 30,
    EventHotelManagement                = 1 << 12,
    EventRegistrationOverride           = 1 << 3,
    EventRequestOwnership               = 1 << 25,
    EventRetentionManagement            = 1 << 21,
    EventScheduleManagement             = 1 << 29,
    EventScheduleOverride               = 1 << 4,
    EventShiftManagement                = 1 << 26,
    EventSupportingTeams                = 1 << 22,
    EventTrainingManagement             = 1 << 13,
    EventVolunteerApplicationOverrides  = 1 << 14,
    EventVolunteerContactInfo           = 1 << 11,

    // Privileges captured by SystemAdministrator:
    SystemAiAccess                      = 1 << 18,
    SystemContentAccess                 = 1 << 16,
    SystemDisplayAccess                 = 1 << 27,
    SystemLogsAccess                    = 1 << 5,
    SystemNardoAccess                   = 1 << 19,
    SystemOutboxAccess                  = 1 << 17,
    SystemSubscriptionEligible          = 1 << 28,
    SystemSubscriptionManagement        = 1 << 24,

    // Privileges captured by VolunteerAdministrator:
    VolunteerAvatarManagement           = 1 << 6,
    VolunteerDataExports                = 1 << 20,
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
        Privilege.Refunds,
        Privilege.Statistics,
    ],

    [Privilege.EventAdministrator]: [
        Privilege.EventApplicationManagement,
        Privilege.EventContentOverride,
        Privilege.EventHelpRequests,
        Privilege.EventHotelManagement,
        Privilege.EventRegistrationOverride,
        Privilege.EventRequestOwnership,
        Privilege.EventRetentionManagement,
        Privilege.EventScheduleManagement,
        Privilege.EventScheduleOverride,
        Privilege.EventShiftManagement,
        Privilege.EventSupportingTeams,
        Privilege.EventTrainingManagement,
        Privilege.EventVolunteerApplicationOverrides,
        Privilege.EventVolunteerContactInfo,
    ],

    [Privilege.SystemAdministrator]: [
        Privilege.SystemAiAccess,
        Privilege.SystemContentAccess,
        Privilege.SystemDisplayAccess,
        Privilege.SystemLogsAccess,
        Privilege.SystemNardoAccess,
        Privilege.SystemOutboxAccess,
        Privilege.SystemSubscriptionEligible,
        Privilege.SystemSubscriptionManagement,
    ],

    [Privilege.VolunteerAdministrator]: [
        Privilege.VolunteerAvatarManagement,
        Privilege.VolunteerDataExports,
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
    [Privilege.Refunds]: 'Special access',
    [Privilege.Statistics]: 'Special access',

    [Privilege.EventAdministrator]: 'Special access',
    [Privilege.EventApplicationManagement]: 'Event access',
    [Privilege.EventContentOverride]: 'Event access',
    [Privilege.EventHelpRequests]: 'Event access',
    [Privilege.EventHotelManagement]: 'Event access',
    [Privilege.EventRegistrationOverride]: 'Event access',
    [Privilege.EventRequestOwnership]: 'Event access',
    [Privilege.EventRetentionManagement]: 'Event access',
    [Privilege.EventScheduleManagement]: 'Event access',
    [Privilege.EventScheduleOverride]: 'Event access',
    [Privilege.EventShiftManagement]: 'Event access',
    [Privilege.EventSupportingTeams]: 'Event access',
    [Privilege.EventTrainingManagement]: 'Event access',
    [Privilege.EventVolunteerApplicationOverrides]: 'Event access',
    [Privilege.EventVolunteerContactInfo]: 'Event access',

    [Privilege.SystemAdministrator]: 'Special access',
    [Privilege.SystemAiAccess]: 'System access',
    [Privilege.SystemContentAccess]: 'System access',
    [Privilege.SystemDisplayAccess]: 'System access',
    [Privilege.SystemLogsAccess]: 'System access',
    [Privilege.SystemNardoAccess]: 'System access',
    [Privilege.SystemOutboxAccess]: 'System access',
    [Privilege.SystemSubscriptionEligible]: 'System access',
    [Privilege.SystemSubscriptionManagement]: 'System access',

    [Privilege.VolunteerAdministrator]: 'Special access',
    [Privilege.VolunteerAvatarManagement]: 'Volunteer access',
    [Privilege.VolunteerDataExports]: 'Volunteer access',
    [Privilege.VolunteerSilentMutations]: 'Volunteer access',
};

/**
 * Names of each of the privileges.
 */
export const PrivilegeNames: { [key in Privilege]: string } = {
    [Privilege.Administrator]: 'Administrator',
    [Privilege.Refunds]: 'Refund requests',
    [Privilege.Statistics]: 'Statistics',

    [Privilege.EventAdministrator]: 'Event administrator',
    [Privilege.EventApplicationManagement]: 'Manage applications',
    [Privilege.EventContentOverride]: 'Always allow access to event content',
    [Privilege.EventHelpRequests]: 'Help requests',
    [Privilege.EventHotelManagement]: 'Manage hotel rooms',
    [Privilege.EventRegistrationOverride]: 'Always allow access to event registration',
    [Privilege.EventRequestOwnership]: 'Manage program requests',
    [Privilege.EventRetentionManagement]: 'Multi-event retention access',
    [Privilege.EventScheduleManagement]: 'Manage schedules',
    [Privilege.EventScheduleOverride]: 'Always allow access to the volunteer portal',
    [Privilege.EventShiftManagement]: 'Manage shifts',
    [Privilege.EventSupportingTeams]: 'Manage first aid & security',
    [Privilege.EventTrainingManagement]: 'Manage trainings',
    [Privilege.EventVolunteerApplicationOverrides]: 'Manage application overrides',
    [Privilege.EventVolunteerContactInfo]: 'Always show volunteer contact info',

    [Privilege.SystemAdministrator]: 'System administrator',
    [Privilege.SystemAiAccess]: 'Generative AI prompts',
    [Privilege.SystemContentAccess]: 'Global content access',
    [Privilege.SystemDisplayAccess]: 'Display access',
    [Privilege.SystemLogsAccess]: 'Logs access',
    [Privilege.SystemNardoAccess]: 'Manage Del a Rie Advies',
    [Privilege.SystemOutboxAccess]: 'Outbox access',
    [Privilege.SystemSubscriptionEligible]: 'Subscription eligibility',
    [Privilege.SystemSubscriptionManagement]: 'Subscription management',

    [Privilege.VolunteerAdministrator]: 'Volunteer administrator',
    [Privilege.VolunteerAvatarManagement]: 'Avatar management',
    [Privilege.VolunteerDataExports]: 'Data exports',
    [Privilege.VolunteerSilentMutations]: 'Silent changes',
};

/**
 * Warnings associated with each of the Privileges.
 */
export const PrivilegeWarnings: { [key in Privilege]?: string } = {
    [Privilege.Administrator]: 'Grants all privileges',

    [Privilege.Refunds]: 'Grants access to financial information',

    [Privilege.EventAdministrator]: 'Grants all event-related privileges',
    [Privilege.SystemAdministrator]: 'Grants all system-related privileges',
    [Privilege.VolunteerAdministrator]: 'Grants all volunteer-related privileges',

    [Privilege.EventHelpRequests]: 'Grants access to incoming help requests',

    [Privilege.SystemOutboxAccess]: 'Access to all sent messages and their content',
    [Privilege.SystemSubscriptionManagement]: 'Access to modify anyone\'s subscriptions',

    [Privilege.VolunteerDataExports]: 'Allows exporting volunteer PII',
    [Privilege.VolunteerSilentMutations]: 'Make changes without informing the volunteer',
};
