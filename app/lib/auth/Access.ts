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

    'root': {
        name: 'Root administrator (role)',
        description:
            'The root administrator role grants all permissions in the system without exception, ' +
            'providing unrestricted access. This includes read/write access to system logs and ' +
            'the ability to update permissions for other people.',
        type: 'boolean',
        warning: true,
    },

    'admin': {
        name: 'Administrator (role)',
        description:
            'The administrator role grants all permissions in the system, except for the ability ' +
            'to remove log entries, to grant or revoke permissions to others, and access to ' +
            'internal tooling only useful for development.',
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

    'event.help-requests': {
        name: 'Help requests',
        description:
            'This permission controls whether they have the ability to see and respond to all ' +
            'incoming help requests from the Volunteering Displays. This ability shows up both ' +
            'in the administration area, and in the scheduling app.',
        requireEvent: true,
        type: 'boolean',
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

    'event.schedules': {
        name: 'Event schedule planning',
        description:
            'This permission decides whether they have the ability to read or update event ' +
            'scheduling, which is specific to a given event and team. The schedules are the ' +
            'rosters shared with volunteers, telling them when they have to be where, doing what.',
        hide: [ 'create', 'delete'],  // schedules are either in read-only more, or fully mutable
        requireEvent: true,
        requireTeam: true,
        type: 'crud',
    },

    'event.shifts': {
        name: 'Event shift planning',
        description:
            'This permission decides whether they have the ability to see or manage the shifts ' +
            'that are planned for a particular event and team. The shifts decide what it is that ' +
            'we expect volunteers to do.',
        requireEvent: true,
        requireTeam: true,
        type: 'crud',
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

    'system.content': {
        name: 'Global content access',
        description:
            'This permission controls whether they are able to access global content, which ' +
            'includes our privacy policy, e-mail messages, notifications and other content that ' +
            'is shared across events and teams.',
        type: 'boolean',
    },

    'system.displays': {
        name: 'Volunteering Display access',
        description:
            'This permission determines whether the volunteer has the ability to manage the ' +
            'volunteering displays we distribute across the festival grounds.',
        type: 'boolean',
    },

    'system.feedback': {
        name: 'Feedback access',
        description:
            'Volunteers have the ability to submit feedback through the portals, as well as ' +
            'through the feedback sub-app. This permission controls whether they have access to ' +
            'read all the feedback, possibly attributed.',
        type: 'boolean',
    },

    'system.internals': {
        name: 'Internal system capabilities',
        description:
            'This permission contains a set of individual permissions for features that will ' +
            'generally not be useful to regular volunteers, as they are part of internal system ' +
            'configuration or debugging capabilities.',
        type: 'boolean',
    },

    'system.internals.ai': {
        name: 'Generative AI-related tooling',
        description:
            'This permission controls whether the volunteer has access to Generative AI-related ' +
            'tooling, such as configuration and debugging pages. This does not include generated ' +
            'e-mail messages, which are granted based on feature availability.',
        type: 'boolean',
    },

    'system.internals.outbox': {
        name: 'System message outbox',
        description:
            'This permission controls whether the volunteer is able to see the messages that ' +
            'have left the Volunteer Manager, including volunteer activity, account activation ' +
            'and recovery messages, and so on.',
        type: 'boolean',
        warning: true,
    },

    'system.internals.scheduler': {
        name: 'System scheduler status',
        description:
            'The system scheduler is responsible for background operations such as sending ' +
            'messages and fetching program updates. This permission controls access to the ' +
            'status and overview pages of the scheduler.',
        type: 'boolean',
    },

    'system.internals.settings': {
        name: 'System settings',
        description:
            'This permission grants access to the Volunteer Manager settings that allow detailed ' +
            'behaviour of the system to be adjusted without needing code changes.',
        type: 'boolean',
    },

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

    'system.nardo': {
        name: 'Del a Rie Advies access',
        description:
            'This permission controls whether they are able to access and manage the advice ' +
            'made available by Del a Rie advies.',
        type: 'boolean',
    },

    'system.subscriptions.management': {
        name: 'Subscription management',
        description:
            'This permission controls whether they are able to manage the notification ' +
            'subscriptions of all eligible users, not just of themselves, and decide who ' +
            'receives which notifications through which channels.',
        type: 'boolean',
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

    'volunteer.pii': {
        name: 'Volunteer contact information',
        description:
            'This permission determines whether this volunteer is able to access all contact ' +
            'information without their access being on demand. This is generally inadvisable as ' +
            'the confirmation is lightweight.',
        type: 'boolean',
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
    root: [
        'root',  // reflection
        'admin',  // reflection

        'event',
        'system',
        'volunteer',
    ],
    admin: [
        'admin',  // reflection

        'event',

        'system.content',
        'system.displays',
        'system.feedback',
        // note: system.internals omitted
        // note: system.logs:delete omitted
        'system.logs:read',
        'system.nardo',
        'system.subscriptions.management',

        'volunteer.avatars',
        'volunteer.export',
        // note: volunteer.permissions:update omitted
        'volunteer.permissions:read',
        'volunteer.pii',
        'volunteer.silent',
    ],

    staff: [
        'event.applications',
        'event.help-requests',
        'event.requests',
        'event.retention',
        'event.schedules',
        'event.shifts',
        'event.vendors',
        'event.visible',
        'volunteer.avatars',
    ],

    senior: [
        'event.applications:read',
        'event.schedules:read',
        'event.shifts:read',
        'event.vendors:read',
        'event.visible',
        'volunteer.avatars',
    ],

    testgroup: [ 'test' ],  // for testing purposes only
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
