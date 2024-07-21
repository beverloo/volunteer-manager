// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { AccessControl, kAnyEvent, kAnyTeam, kPermissionPattern } from './AccessControl';
import { kPermissionGroups } from './Access';

describe('AccessControl', () => {
    it.each([
        [ 'foo', 'passes' ],
        [ 'foo:create', 'passes' ],
        [ 'foo:read', 'passes' ],
        [ 'foo:update', 'passes' ],
        [ 'foo:delete', 'passes' ],
        [ 'foo.bar', 'passes' ],
        [ 'foo.bar:create', 'passes' ],
        [ 'foo.bar:read', 'passes' ],
        [ 'foo.bar:update', 'passes' ],
        [ 'foo.bar:delete', 'passes' ],
        [ 'foo.bar.baz', 'passes' ],

        [ '', 'fails' ],
        [ ' ', 'fails' ],
        [ 'foo:unicorn', 'fails' ],
        [ 'bar:unicorn', 'fails' ],
        [ 'foo,bar', 'fails' ],
        [ '1234', 'fails' ],
        [ 'foo$bar', 'fails' ],

    ])('should verify that syntax validation for "%s" %s', (pattern, expected) => {
        const result = kPermissionPattern.test(pattern);
        switch (expected) {
            case 'passes':
                expect(result).toBeTrue();
                break;
            case 'fails':
                expect(result).toBeFalse();
                break;
            default:
                throw new Error(`Unexpected expected result: "${expected}"`);
        }
    });

    it('should enable boolean permissions to be granted or revoked', () => {
        const accessControl = new AccessControl({
            grants: [
                'test',
                'test.boolean.required.team',
            ],
            revokes: [
                'test.boolean.required.team',
            ],
        });

        const scope = { event: kAnyEvent, team: kAnyTeam };

        expect(accessControl.query('test.boolean')).not.toBeUndefined();
        expect(accessControl.query('test.boolean.required.both', scope)).not.toBeUndefined();

        expect(accessControl.query('test.boolean.required.event', scope)).not.toBeUndefined();
        expect(accessControl.query('test.boolean.required.event', scope)).toEqual({
            result: 'granted',
            crud: false,
            expanded: true,
            global: true,
            scope: 'global',
        });

        expect(accessControl.query('test.boolean.required.team', scope)).not.toBeUndefined();
        expect(accessControl.query('test.boolean.required.team', scope)).toEqual({
            result: 'revoked',
            crud: false,
            expanded: false,
            global: true,
            scope: 'global',
        });
    });

    it('should enable CRUD permissions to be granted or revoked', () => {
        const fullAccessControl = new AccessControl({
            grants: [
                'test.crud',
                'test.crud:delete',
            ],
        });

        const scope = { event: kAnyEvent, team: kAnyTeam };

        expect(fullAccessControl.query('test.boolean')).toBeUndefined();
        expect(fullAccessControl.query('test.boolean.required.both', scope)).toBeUndefined();

        expect(fullAccessControl.query('test.crud', 'create')).not.toBeUndefined();
        expect(fullAccessControl.query('test.crud', 'create')).toEqual({
            result: 'granted',
            crud: false,
            expanded: true,
            global: true,
        });

        expect(fullAccessControl.query('test.crud', 'read')).toEqual(
            fullAccessControl.query('test.crud', 'create'));
        expect(fullAccessControl.query('test.crud', 'update')).toEqual(
            fullAccessControl.query('test.crud', 'create'));

        expect(fullAccessControl.query('test.crud', 'delete')).not.toBeUndefined();
        expect(fullAccessControl.query('test.crud', 'delete')).toEqual({
            result: 'granted',
            crud: true,  // this was an explicit grant on the CRUD operation
            expanded: false,
            global: true,
        });

        const partialAccessControl = new AccessControl({
            grants: 'test.crud',
            revokes: 'test.crud:delete',
        });

        expect(partialAccessControl.query('test.boolean')).toBeUndefined();
        expect(partialAccessControl.query('test.boolean.required.both', scope)).toBeUndefined();

        expect(partialAccessControl.query('test.crud', 'create')).not.toBeUndefined();
        expect(partialAccessControl.query('test.crud', 'create')).toEqual({
            result: 'granted',
            crud: false,
            expanded: true,
            global: true,
        });

        expect(partialAccessControl.query('test.crud', 'delete')).not.toBeUndefined();
        expect(partialAccessControl.query('test.crud', 'delete')).toEqual({
            result: 'revoked',
            crud: true,  // this was an explicit revoke on the CRUD operation
            expanded: false,
            global: true,
        });

        expect(partialAccessControl.query('test.crud', 'read')).toEqual(
            partialAccessControl.query('test.crud', 'create'));
        expect(partialAccessControl.query('test.crud', 'update')).toEqual(
            partialAccessControl.query('test.crud', 'create'));
    });

    it('should respect hierarchical permission definitions', () => {
        const accessControl = new AccessControl({
            grants: 'test',
            revokes: 'test.boolean',
        });

        const scope = { event: kAnyEvent, team: kAnyTeam };

        expect(accessControl.query('test.crud', 'create')).toEqual({
            result: 'granted',
            crud: false,
            expanded: true,
            global: true,
        });

        expect(accessControl.query('test.boolean')).toEqual({
            result: 'revoked',
            crud: false,
            expanded: false,
            global: true,
        });

        expect(accessControl.query('test.boolean.required.both', scope)).toEqual({
            result: 'revoked',
            crud: false,
            expanded: true,
            global: true,
            scope: 'global',
        });
    });

    it('should respect requirements for the event and/or team scope to be set', () => {
        const accessControl = new AccessControl({
            grants: 'test',
        });

        // Without event + team:
        expect(() => accessControl.query('test.boolean.required.both')).toThrow();
        expect(() => accessControl.query('test.boolean.required.event')).toThrow();
        expect(() => accessControl.query('test.boolean.required.team')).toThrow();

        // Without team:
        expect(() =>
            accessControl.query('test.boolean.required.both', { event: '2024' }))
                .toThrow();
        expect(() =>
            accessControl.query('test.boolean.required.event', { event: '2024' }))
                .not.toThrow();
        expect(() =>
            accessControl.query('test.boolean.required.team', { event: '2024' }))
                .toThrow();

        // Without event:
        expect(() =>
            accessControl.query('test.boolean.required.both', { team: 'crew' }))
                .toThrow();
        expect(() =>
            accessControl.query('test.boolean.required.event', { team: 'crew' }))
                .toThrow();
        expect(() =>
            accessControl.query('test.boolean.required.team', { team: 'crew' }))
                .not.toThrow();

        // With event + team:
        expect(() =>
            accessControl.query('test.boolean.required.both', { event: '2024', team: 'crew' }))
                .not.toThrow();
        expect(() =>
            accessControl.query('test.boolean.required.event', { event: '2024', team: 'crew' }))
                .not.toThrow();
        expect(() =>
            accessControl.query('test.boolean.required.team', { event: '2024', team: 'crew' }))
                .not.toThrow();
    });

    it('should be able to revoke permissions for specific events or teams', () => {
        const accessControl = new AccessControl({
            grants: 'test',
            revokes: [
                {
                    permission: 'test.boolean',
                    event: '2025',
                    team: 'crew',
                },
                {
                    permission: 'test.boolean.required.event',
                    event: '2025',
                },
                {
                    permission: 'test.boolean.required.team',
                    team: 'crew',
                },
            ],

            events: kAnyEvent,
            teams: kAnyTeam,
        });

        // Event:
        expect(accessControl.can('test.boolean')).toBeFalse();  // no more unrestricted access
        expect(accessControl.can('test.boolean', { event: '2024' })).toBeTrue();
        expect(accessControl.can('test.boolean', { event: '2025' })).toBeFalse();
        expect(accessControl.can('test.boolean', { event: kAnyEvent })).toBeTrue();

        expect(accessControl.can('test.crud', 'read')).toBeTrue();  // unrestricted access
        expect(accessControl.can('test.crud', 'read', { event: '2024' })).toBeTrue();
        expect(accessControl.can('test.crud', 'read', { event: '2025' })).toBeTrue();
        expect(accessControl.can('test.crud', 'read', { event: kAnyEvent })).toBeTrue();

        expect(accessControl.can('test.boolean.required.event', { event: '2024' })).toBeTrue();
        expect(accessControl.can('test.boolean.required.event', { event: '2025' })).toBeFalse();
        expect(accessControl.can('test.boolean.required.event', { event: kAnyEvent })).toBeTrue();

        // Team:
        expect(accessControl.can('test.boolean')).toBeFalse();  // no more unrestricted access
        expect(accessControl.can('test.boolean', { team: 'hosts' })).toBeTrue();
        expect(accessControl.can('test.boolean', { team: 'crew' })).toBeFalse();
        expect(accessControl.can('test.boolean', { team: kAnyTeam })).toBeTrue();

        expect(accessControl.can('test.crud', 'read')).toBeTrue();  // unrestricted access
        expect(accessControl.can('test.crud', 'read', { team: 'hosts' })).toBeTrue();
        expect(accessControl.can('test.crud', 'read', { team: 'crew' })).toBeTrue();
        expect(accessControl.can('test.crud', 'read', { team: kAnyTeam })).toBeTrue();

        expect(accessControl.can('test.boolean.required.team', { team: 'hosts' })).toBeTrue();
        expect(accessControl.can('test.boolean.required.team', { team: 'crew' })).toBeFalse();
        expect(accessControl.can('test.boolean.required.team', { team: kAnyTeam })).toBeTrue();
    });

    it('should expand the Volunteer Manager permission groups', () => {
        expect(kPermissionGroups).toHaveProperty('testgroup');  // verify the input condition

        const accessControl = new AccessControl({ grants: 'testgroup' });
        expect(accessControl.query('test.boolean')).toEqual({
            result: 'granted',
            crud: false,
            expanded: true,
            global: true,
        });

        expect(accessControl.query('test.crud', 'create')).toEqual({
            result: 'granted',
            crud: false,
            expanded: true,
            global: true,
        });
    });

    it('should be able to reduce access queries to a boolean result', () => {
        const accessControl = new AccessControl({
            grants: 'test.boolean',
        });

        expect(accessControl.can('test.boolean')).toBeTrue();
        expect(accessControl.can('test.crud', 'create')).toBeFalse();
    });

    it('should be able to require access queries to be successful', () => {
        const accessControl = new AccessControl({
            grants: 'test.crud:update',
        });

        expect(() => accessControl.require('test.boolean')).toThrow();
        expect(() => accessControl.require('test.crud', 'read')).toThrow();
        expect(() => accessControl.require('test.crud', 'update')).not.toThrow();
    });

    it('should behave sensibly when it comes down to event visibility checks', () => {
        // This is a reference test for the permission system with expected outcomes for the
        // "event.visible" permission, which heavily relies on automatically granted scoping rules.
        // Any change in this test should be carefully reviewed.

        const accessControl = new AccessControl({
            grants: [
                {
                    permission: 'staff',
                    event: '2024',
                    team: 'crew',
                },
                {
                    permission: 'senior',
                    event: '2023',
                    team: 'hosts',
                }
            ],
            teams: 'example',
        });

        // They have access to at least one event:
        expect(accessControl.can('event.visible', { event: kAnyEvent, team: kAnyTeam })).toBeTrue();

        // They are able to access 2023 and 2024:
        expect(accessControl.can('event.visible', { event: '2022', team: kAnyTeam })).toBeFalse();
        expect(accessControl.can('event.visible', { event: '2023', team: kAnyTeam })).toBeTrue();
        expect(accessControl.can('event.visible', { event: '2024', team: kAnyTeam })).toBeTrue();
        expect(accessControl.can('event.visible', { event: '2025', team: kAnyTeam })).toBeFalse();

        // They are able to access crew, host and example information:
        expect(accessControl.can('event.visible', { event: kAnyEvent, team: 'tech' })).toBeFalse();
        expect(accessControl.can('event.visible', { event: kAnyEvent, team: 'crew' })).toBeTrue();
        expect(accessControl.can('event.visible', { event: kAnyEvent, team: 'hosts' })).toBeTrue();
        expect(accessControl.can('event.visible', { event: kAnyEvent, team: 'example' }))
            .toBeTrue();
        expect(accessControl.can('event.visible', { event: kAnyEvent, team: 'stewards' }))
            .toBeFalse();

        // They are able to access Crew, Example and Host team information:
        expect(accessControl.can('event.visible', { event: '2022', team: 'crew' })).toBeFalse();
        expect(accessControl.can('event.visible', { event: '2023', team: 'crew' })).toBeFalse();
        expect(accessControl.can('event.visible', { event: '2024', team: 'crew' })).toBeTrue();
        expect(accessControl.can('event.visible', { event: '2025', team: 'crew' })).toBeFalse();

        expect(accessControl.can('event.visible', { event: '2022', team: 'example' })).toBeFalse();
        expect(accessControl.can('event.visible', { event: '2023', team: 'example' })).toBeTrue();
        expect(accessControl.can('event.visible', { event: '2024', team: 'example' })).toBeTrue();
        expect(accessControl.can('event.visible', { event: '2025', team: 'example' })).toBeFalse();

        expect(accessControl.can('event.visible', { event: '2022', team: 'hosts' })).toBeFalse();
        expect(accessControl.can('event.visible', { event: '2023', team: 'hosts' })).toBeTrue();
        expect(accessControl.can('event.visible', { event: '2024', team: 'hosts' })).toBeFalse();
        expect(accessControl.can('event.visible', { event: '2025', team: 'hosts' })).toBeFalse();
    });
});
