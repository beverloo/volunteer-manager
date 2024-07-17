// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { AccessDescriptor } from './AccessDescriptor';

/**
 * List of permissions available in the Volunteer Manager. Keep grouped based on namespace, then
 * alphabetized based on the individual permission names.
 */
export const kPermissions = {
    // ---------------------------------------------------------------------------------------------
    // Administrator permission
    // ---------------------------------------------------------------------------------------------

    'admin': {
        name: 'Administrator (role)',
        description:
            'The administrator role grants all permissions in the system without exception, ' +
            'including full access to all event and volunteer information.',
        type: 'boolean',
        warning: true,
    },

    // ---------------------------------------------------------------------------------------------
    // Event-associated permissions
    // ---------------------------------------------------------------------------------------------

    'event.applications': {
        name: 'Event volunteer applications',
        description:
            'This permission determines whether the volunteer is able to deal with incoming ' +
            'participation applications.',
        hide: [ 'delete' ],  // applications must be responded to, even if done silently
        requireEvent: true,
        requireTeam: true,
        type: 'crud',
    },

    'event.requests': {
        name: 'Program request management',
        description:
            'This permission describes whether they have the ability to manage incoming program ' +
            'requests set in AnPlan. Doing so requires collaboration across the broader AnimeCon ' +
            'organisation.',
        requireEvent: true,
        type: 'boolean',
    },

    'event.retention': {
        name: 'Retention management',
        description:
            'This permission grants them access to the ability to help out with retention ' +
            'management for a particular event and team. It can reveal contact information of ' +
            'people who helped us out in the past to them.',
        requireEvent: true,
        requireTeam: true,
        type: 'boolean',
    },

    'event.vendors': {
        name: 'Vendor team schedules',
        description:
            'This permission determines whether the volunteer has the ability to manage vendor ' +
            'information part of the teams they have access to, for example the first aid and ' +
            'security teams.',
        hide: [ 'create', 'delete' ],  // schedules can only be read or updated
        requireEvent: true,
        requireTeam: true,
        type: 'crud',
    },

    'event.visible': {
        name: 'Event visibility',
        description:
            'The event visibility permission determined whether the volunteer is able to see the ' +
            'existence of a particular event, for example in the admin area.',
        requireEvent: true,
        type: 'boolean',
    },

    // ---------------------------------------------------------------------------------------------
    // System-associated permissions
    // ---------------------------------------------------------------------------------------------

    'system.logs': {
        name: 'Volunteer Manager logs',
        description:
            'This permission determines whether the volunteer is able to access system logs. The ' +
            'logs contain all account activity, actions and changes that are made in the ' +
            'Volunteer Manager, without exception.',
        hide: [ 'create', 'update' ],  // logs generally should be read-only, but can be deleted
        type: 'crud',
        warning: true,
    },

    // ---------------------------------------------------------------------------------------------
    // Volunteer-associated permissions
    // ---------------------------------------------------------------------------------------------

    'volunteer.avatars': {
        name: 'Avatar management',
        description:
            'This permission controls whether they have the ability to manage avatars of other ' +
            'volunteers, i.e. update new photos or delete existing ones.',
        type: 'boolean',
    },

    'volunteer.export': {
        name: 'Export volunteering information',
        description:
            'This description controls whether they have the ability to export portions of ' +
            'volunteering information for purposes of sharing this with a third party. All our ' +
            'data export mechanisms are GDPR compatible.',
        type: 'boolean',
        warning: true,
    },

    'volunteer.permissions': {
        name: 'Volunteer account permissions',
        description:
            'This permission determines whether the volunteer is able to manage the permissions ' +
            'of other volunteers. This is an extremely dangerous permission, as it enables them ' +
            'to manage their own permissions as well.',
        hide: [ 'create', 'delete' ],  // all mutations are considered updates
        type: 'crud',
        warning: true,
    },

    'volunteer.silent': {
        name: 'Silent mutations',
        description:
            'This permission controls whether they have the ability to make significant changes ' +
            'to someone\'s participation in an event without having to send them a message.',
        type: 'boolean',
        warning: true,
    },

    // ---------------------------------------------------------------------------------------------
    // Permissions that exist for testing purposes
    // ---------------------------------------------------------------------------------------------

    'test.boolean': {
        name: 'Test (boolean)',
        description: 'Boolean permission exclusively used for testing purposes',
        hide: true,  // rationale: testing-only permission
        type: 'boolean',
    },

    'test.boolean.required.both': {
        name: 'Test (boolean w/ event + team)',
        description: 'Boolean permission exclusively used for testing purposes w/ required scoping',
        hide: true,  // rationale: testing-only permission
        requireEvent: true,
        requireTeam: true,
        type: 'boolean',
    },

    'test.boolean.required.event': {
        name: 'Test (boolean w/ event)',
        description: 'Boolean permission exclusively used for testing purposes w/ required event',
        hide: true,  // rationale: testing-only permission
        requireEvent: true,
        type: 'boolean',
    },

    'test.boolean.required.team': {
        name: 'Test (boolean w/ team)',
        description: 'Boolean permission exclusively used for testing purposes w/ required team',
        hide: true,  // rationale: testing-only permission
        requireTeam: true,
        type: 'boolean',
    },

    'test.crud': {
        name: 'Test (CRUD)',
        description: 'CRUD permission exculsively used for testing purposes',
        hide: true,  // rationale: testing-only permission
        type: 'crud',
    },

} satisfies Record<string, AccessDescriptor>;

// -------------------------------------------------------------------------------------------------

/**
 * Permission groups that will be expanded prior to being applied. For example, when a user has been
 * granted the "admin" permission, permissions included in the associated list will also be granted.
 */
export const kPermissionGroups: Record<string, string[]> = {
    admin: [
        'admin',  // reflection

        'event',
        'system',
        'volunteer',

        'test',
    ],
    everyone: [
        // no implicitly granted permissions
    ],
    staff: [
        'event.applications:read',
        'event.applications:update',
        'event.requests',
        'event.retention',
        'event.vendors',
        'event.visible',
        'volunteer.avatars',
    ],
    senior: [
        'event.applications:read',
        'event.vendors:read',
        'event.visible',
        'volunteer.avatars',
    ],
};

// -------------------------------------------------------------------------------------------------

/**
 * Selects the permissions from `Source` whose type matches the given `Type`.
 */
type PermissionListForType<Source, Type> =
    { [K in keyof Source]: Source[K] extends { type: Type } ? K : never }[keyof Source];

/**
 * Type listing every permission known to the Volunteer Manager.
 */
export type Permission = keyof typeof kPermissions;

/**
 * Type listing every boolean permission known to the Volunteer Manager.
 */
export type BooleanPermission = PermissionListForType<typeof kPermissions, 'boolean'>;

/**
 * Type listing every CRUD permission known to the Volunteer Manager.
 */
export type CRUDPermission = PermissionListForType<typeof kPermissions, 'crud'>;
