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
    // Volunteer-associated permissions
    // ---------------------------------------------------------------------------------------------

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

    // ---------------------------------------------------------------------------------------------
    // Permissions that exist for testing purposes
    // ---------------------------------------------------------------------------------------------

    'test.boolean': {
        name: 'Test (boolean)',
        description: 'Boolean permission exclusively used for testing purposes',
        hidden: true,  // rationale: testing-only permission
        type: 'boolean',
    },

    'test.boolean.required.both': {
        name: 'Test (boolean w/ event + team)',
        description: 'Boolean permission exclusively used for testing purposes w/ required scoping',
        hidden: true,  // rationale: testing-only permission
        requireEvent: true,
        requireTeam: true,
        type: 'boolean',
    },

    'test.boolean.required.event': {
        name: 'Test (boolean w/ event)',
        description: 'Boolean permission exclusively used for testing purposes w/ required event',
        hidden: true,  // rationale: testing-only permission
        requireEvent: true,
        type: 'boolean',
    },

    'test.boolean.required.team': {
        name: 'Test (boolean w/ team)',
        description: 'Boolean permission exclusively used for testing purposes w/ required team',
        hidden: true,  // rationale: testing-only permission
        requireTeam: true,
        type: 'boolean',
    },

    'test.crud': {
        name: 'Test (CRUD)',
        description: 'CRUD permission exculsively used for testing purposes',
        hidden: true,  // rationale: testing-only permission
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
        'event',
        'volunteer',
        'test',
    ],
    everyone: [
        // no implicitly granted permissions
    ],
    staff: [
        'event.visible',
    ],
    senior: [
        'event.visible',
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
