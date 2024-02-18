// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { User } from './User';

/**
 * Enumeration of the privileges that can be assigned to individual users. Do not renumber or change
 * the order of these entries, instead, mark them as deprecated and add new ones to the bottom.
 *
 * Next setting: 1 << 25
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
    EventHotelManagement                = 1 << 12,
    EventRegistrationOverride           = 1 << 3,
    EventRetentionManagement            = 1 << 21,
    EventScheduleOverride               = 1 << 4,
    EventSupportingTeams                = 1 << 22,
    EventTrainingManagement             = 1 << 13,
    EventVolunteerApplicationOverrides  = 1 << 14,
    EventVolunteerContactInfo           = 1 << 11,

    // Privileges captured by SystemAdministrator:
    SystemAiAccess                      = 1 << 18,
    SystemContentAccess                 = 1 << 16,
    SystemLogsAccess                    = 1 << 5,
    SystemNardoAccess                   = 1 << 19,
    SystemOutboxAccess                  = 1 << 17,
    SystemWhatsAppAccess                = 1 << 24,

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
export function can(user: User | undefined, privilege: Privilege): boolean {
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
        Privilege.EventHotelManagement,
        Privilege.EventRegistrationOverride,
        Privilege.EventRetentionManagement,
        Privilege.EventScheduleOverride,
        Privilege.EventSupportingTeams,
        Privilege.EventTrainingManagement,
        Privilege.EventVolunteerApplicationOverrides,
        Privilege.EventVolunteerContactInfo,
    ],

    [Privilege.SystemAdministrator]: [
        Privilege.SystemAiAccess,
        Privilege.SystemContentAccess,
        Privilege.SystemLogsAccess,
        Privilege.SystemNardoAccess,
        Privilege.SystemOutboxAccess,
        Privilege.SystemWhatsAppAccess,
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
    [Privilege.EventHotelManagement]: 'Event access',
    [Privilege.EventRegistrationOverride]: 'Event access',
    [Privilege.EventRetentionManagement]: 'Event access',
    [Privilege.EventScheduleOverride]: 'Event access',
    [Privilege.EventSupportingTeams]: 'Event access',
    [Privilege.EventTrainingManagement]: 'Event access',
    [Privilege.EventVolunteerApplicationOverrides]: 'Event access',
    [Privilege.EventVolunteerContactInfo]: 'Event access',

    [Privilege.SystemAdministrator]: 'Special access',
    [Privilege.SystemAiAccess]: 'System access',
    [Privilege.SystemContentAccess]: 'System access',
    [Privilege.SystemLogsAccess]: 'System access',
    [Privilege.SystemNardoAccess]: 'System access',
    [Privilege.SystemOutboxAccess]: 'System access',
    [Privilege.SystemWhatsAppAccess]: 'System access',

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
    [Privilege.EventHotelManagement]: 'Manage hotel rooms',
    [Privilege.EventRegistrationOverride]: 'Always allow access to event registration',
    [Privilege.EventRetentionManagement]: 'Multi-event retention access',
    [Privilege.EventScheduleOverride]: 'Always allow access to the volunteer portal',
    [Privilege.EventSupportingTeams]: 'Manage first aid & security',
    [Privilege.EventTrainingManagement]: 'Manage trainings',
    [Privilege.EventVolunteerApplicationOverrides]: 'Manage application overrides',
    [Privilege.EventVolunteerContactInfo]: 'Always show volunteer contact info',

    [Privilege.SystemAdministrator]: 'System administrator',
    [Privilege.SystemAiAccess]: 'Generative AI prompts',
    [Privilege.SystemContentAccess]: 'Global content access',
    [Privilege.SystemLogsAccess]: 'Logs access',
    [Privilege.SystemNardoAccess]: 'Manage Del a Rie Advies',
    [Privilege.SystemOutboxAccess]: 'Outbox access',
    [Privilege.SystemWhatsAppAccess]: 'WhatsApp access',

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

    [Privilege.SystemOutboxAccess]: 'Access to all sent e-mails and their content',

    [Privilege.VolunteerDataExports]: 'Allows exporting volunteer PII',
    [Privilege.VolunteerSilentMutations]: 'Make changes without informing the volunteer',
};
