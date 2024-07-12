// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { AccessControl, kEveryEvent, kEveryTeam, kPermissionPattern } from './AccessControl';

describe('AccessControl', () => {
    it('has an expression to validate both grants and permissions', () => {
        const kPermissionTestCases = {
            valid: [
                'foo',
                'foo:create',
                'foo:read',
                'foo:update',
                'foo:delete',
                'foo.bar',
                'foo.bar:create',
                'foo.bar:read',
                'foo.bar:update',
                'foo.bar:delete',
                'foo.bar.baz',
            ],
            invalid: [
                '',
                ' ',
                'foo:unicorn',
                'bar:unicorn',
                'foo,bar',
                '1234',
                'foo$bar',
            ],
        };

        function runTest(testCase: string, expected: boolean) {
            if (kPermissionPattern.test(testCase) === expected)
                return true;  // pass

            return `Case '${testCase}' unexpectedly ${!!expected ? 'failed' : 'passed'}`;
        }

        for (const testCase of kPermissionTestCases.valid)
            expect(runTest(testCase, /* expected= */ true)).toBeTrue();
        for (const testCase of kPermissionTestCases.invalid)
            expect(runTest(testCase, /* expected= */ false)).toBeTrue();
    });

    it('has the ability to grant individual permissions', () => {
        const accessControl = new AccessControl({
            grants: 'test.boolean',
        });

        expect(accessControl.can('test.boolean')).toBeTrue();
        expect(accessControl.can('test.crud', 'read')).toBeFalse();
    });

    it('has the ability to grant individual CRUD operations', () => {
        const accessControl = new AccessControl({
            grants: [ 'test.crud:create', 'test.crud:read' ],
        });

        expect(accessControl.can('test.crud', 'create')).toBeTrue();
        expect(accessControl.can('test.crud', 'read')).toBeTrue();
        expect(accessControl.can('test.crud', 'update')).toBeFalse();
        expect(accessControl.can('test.crud', 'delete')).toBeFalse();
    });

    it('has the ability to grant multiple permissions', () => {
        const accessControl = new AccessControl({
            grants: 'test.boolean,test.crud',
        });

        expect(accessControl.can('test.boolean')).toBeTrue();
        expect(accessControl.can('test.crud', 'read')).toBeTrue();
    });

    it('has the ability to grant permission namespaces', () => {
        const accessControl = new AccessControl({
            grants: 'test',
        });

        expect(accessControl.can('test.boolean')).toBeTrue();
        expect(accessControl.can('test.crud', 'read')).toBeTrue();
        expect(accessControl.can('test.crud', 'delete')).toBeTrue();
    });

    it('has the ability to revoke individual permissions', () => {
        const accessControl = new AccessControl({
            grants: 'test.boolean,test.crud',
            revokes: 'test.crud',
        });

        expect(accessControl.can('test.boolean')).toBeTrue();
        expect(accessControl.can('test.crud', 'read')).toBeFalse();
        expect(accessControl.can('test.crud', 'delete')).toBeFalse();
    });

    it('has the ability to revoke individual CRUD operations', () => {
        const accessControl = new AccessControl({
            grants: 'test.crud',
            revokes: [ { permission: 'test.crud:delete' } ],
        });

        expect(accessControl.can('test.boolean')).toBeFalse();
        expect(accessControl.can('test.crud', 'create')).toBeTrue();
        expect(accessControl.can('test.crud', 'read')).toBeTrue();
        expect(accessControl.can('test.crud', 'update')).toBeTrue();
        expect(accessControl.can('test.crud', 'delete')).toBeFalse();
    });

    it('has the ability to revoke permission namespaces', () => {
        const accessControl = new AccessControl({
            grants: 'test',
            revokes: 'test',
        });

        expect(accessControl.can('test.boolean')).toBeFalse();
        expect(accessControl.can('test.crud', 'read')).toBeFalse();
    });

    it('has the ability to expand permission groups', () => {
        const accessControl = new AccessControl({
            grants: 'admin',
            revokes: 'test.crud:delete',
        });

        expect(accessControl.can('test.boolean')).toBeTrue();
        expect(accessControl.can('test.crud', 'create')).toBeTrue();
        expect(accessControl.can('test.crud', 'read')).toBeTrue();
        expect(accessControl.can('test.crud', 'update')).toBeTrue();
        expect(accessControl.can('test.crud', 'delete')).toBeFalse();
    });

    it('has the ability to require a permission to be granted', () => {
        const accessControl = new AccessControl({
            grants: 'test.crud:update',
        });

        expect(() => accessControl.require('test.boolean')).toThrow();
        expect(() => accessControl.require('test.crud', 'read')).toThrow();
        expect(() => accessControl.require('test.crud', 'update')).not.toThrow();
    });

    it('has the ability to grant holistic access to a given event', () => {
        const fullAccessControl = new AccessControl({
            grants: 'test.boolean',
            events: kEveryEvent,
        });

        expect(fullAccessControl.can('test.boolean')).toBeTrue();
        expect(fullAccessControl.can('test.boolean', { event: '2024' })).toBeTrue();
        expect(fullAccessControl.can('test.boolean', { event: '2025' })).toBeTrue();

        const scopedAccessControl = new AccessControl({
            grants: 'test.boolean',
            events: '2024',
        });

        expect(scopedAccessControl.can('test.boolean')).toBeTrue();
        expect(scopedAccessControl.can('test.boolean', { event: '2024' })).toBeTrue();
        expect(scopedAccessControl.can('test.boolean', { event: '2025' })).toBeFalse();

        const unknownAccessControl = new AccessControl({
            grants: 'test.boolean',
            // `events` deliberately undefined
        });

        expect(unknownAccessControl.can('test.boolean')).toBeTrue();
        expect(unknownAccessControl.can('test.boolean', { event: '2024' })).toBeFalse();
        expect(unknownAccessControl.can('test.boolean', { event: '2025' })).toBeFalse();
    });

    it('has the ability to grant holistic access to a given team', () => {
        const fullAccessControl = new AccessControl({
            grants: 'test.boolean',
            teams: kEveryTeam,
        });

        expect(fullAccessControl.can('test.boolean')).toBeTrue();
        expect(fullAccessControl.can('test.boolean', { team: 'crew' })).toBeTrue();
        expect(fullAccessControl.can('test.boolean', { team: 'hosts' })).toBeTrue();

        const scopedAccessControl = new AccessControl({
            grants: 'test.boolean',
            teams: 'crew',
        });

        expect(scopedAccessControl.can('test.boolean')).toBeTrue();
        expect(scopedAccessControl.can('test.boolean', { team: 'crew' })).toBeTrue();
        expect(scopedAccessControl.can('test.boolean', { team: 'hosts' })).toBeFalse();

        const unknownAccessControl = new AccessControl({
            grants: 'test.boolean',
            // `teams` deliberately omitted
        });

        expect(unknownAccessControl.can('test.boolean')).toBeTrue();
        expect(unknownAccessControl.can('test.boolean', { team: 'crew' })).toBeFalse();
        expect(unknownAccessControl.can('test.boolean', { team: 'hosts' })).toBeFalse();
    });

    it('has the ability to grant permissions specific to a given event or team', () => {
        const singleEventAccessControl = new AccessControl({
            grants: [
                {
                    permission: 'test.boolean',
                    event: '2024',
                }
            ],
            // `events` deliberately omitted
        });

        expect(singleEventAccessControl.can('test.boolean')).toBeTrue();  // FIXME?
        expect(singleEventAccessControl.can('test.boolean', { event: '2024' })).toBeTrue();
        expect(singleEventAccessControl.can('test.boolean', { event: '2025' })).toBeFalse();

        const doubleEventAccessControl = new AccessControl({
            grants: [
                {
                    permission: 'test.boolean',
                    event: '2024',
                }
            ],
            events: '2025',
        });

        expect(doubleEventAccessControl.can('test.boolean')).toBeTrue();  // FIXME?
        expect(doubleEventAccessControl.can('test.boolean', { event: '2024' })).toBeTrue();
        expect(doubleEventAccessControl.can('test.boolean', { event: '2025' })).toBeTrue();
        expect(doubleEventAccessControl.can('test.boolean', { event: '2026' })).toBeFalse();

        const singleTeamAccessControl = new AccessControl({
            grants: [
                {
                    permission: 'test.boolean',
                    team: 'hosts',
                }
            ],
            // `teams` deliberately omitted
        });

        expect(singleTeamAccessControl.can('test.boolean')).toBeTrue();  // FIXME?
        expect(singleTeamAccessControl.can('test.boolean', { team: 'crew' })).toBeFalse();
        expect(singleTeamAccessControl.can('test.boolean', { team: 'hosts' })).toBeTrue();

        const doubleTeamAccessControl = new AccessControl({
            grants: [
                {
                    permission: 'test.boolean',
                    team: 'stewards',
                }
            ],
            teams: 'crew',
        });

        expect(doubleTeamAccessControl.can('test.boolean')).toBeTrue();  // FIXME?
        expect(doubleTeamAccessControl.can('test.boolean', { team: 'crew' })).toBeTrue();
        expect(doubleTeamAccessControl.can('test.boolean', { team: 'hosts' })).toBeFalse();
        expect(doubleTeamAccessControl.can('test.boolean', { team: 'stewards' })).toBeTrue();
    });

    it('has the ability to revoke permissions specific to a given event or team', () => {
        const scopedEventAccessControl = new AccessControl({
            grants: 'test.boolean',
            revokes: {
                permission: 'test.boolean',
                event: '2024',
            },
            events: kEveryEvent,
        });

        expect(scopedEventAccessControl.can('test.boolean')).toBeFalse();
        expect(scopedEventAccessControl.can('test.boolean', { event: '2024' })).toBeFalse();
        expect(scopedEventAccessControl.can('test.boolean', { event: '2025' })).toBeTrue();

        const partialEventAccessControl = new AccessControl({
            grants: [
                {
                    permission: 'test.boolean',
                    event: '2024',
                },
                {
                    permission: 'test.boolean',
                    event: '2025',
                }
            ],
            revokes: {
                permission: 'test.boolean',
                event: '2024',
            },
        });

        expect(partialEventAccessControl.can('test.boolean')).toBeFalse();
        expect(partialEventAccessControl.can('test.boolean', { event: '2024' })).toBeFalse();
        expect(partialEventAccessControl.can('test.boolean', { event: '2025' })).toBeTrue();

        const scopedTeamAccessControl = new AccessControl({
            grants: 'test.boolean',
            revokes: {
                permission: 'test.boolean',
                team: 'crew',
            },
            teams: kEveryTeam,
        });

        expect(scopedTeamAccessControl.can('test.boolean')).toBeFalse();
        expect(scopedTeamAccessControl.can('test.boolean', { team: 'crew' })).toBeFalse();
        expect(scopedTeamAccessControl.can('test.boolean', { team: 'hosts' })).toBeTrue();

        const partialTeamAccessControl = new AccessControl({
            grants: [
                {
                    permission: 'test.boolean',
                    team: 'crew',
                },
                {
                    permission: 'test.boolean',
                    team: 'hosts',
                }
            ],
            revokes: {
                permission: 'test.boolean',
                team: 'crew',
            },
        });

        expect(partialTeamAccessControl.can('test.boolean')).toBeFalse();
        expect(partialTeamAccessControl.can('test.boolean', { team: 'crew' })).toBeFalse();
        expect(partialTeamAccessControl.can('test.boolean', { team: 'hosts' })).toBeTrue();
    });

    it('has the ability to grant role-based permissions specific', () => {
        const accessControl = new AccessControl({
            grants: [
                'test',
                {
                    permission: 'senior',
                    event: '2024',
                    team: 'crew',
                }
            ],
        });

        expect(accessControl.can('test.boolean')).toBeTrue();

        expect(accessControl.can('event.visible')).toBeTrue();  // FIXME

        expect(accessControl.can('event.visible', { event: '2024', team: kEveryTeam })).toBeTrue();
        expect(accessControl.can('event.visible', { event: '2025', team: kEveryTeam })).toBeFalse();

        expect(accessControl.can('event.visible', { event: '2024', team: 'crew' })).toBeTrue();
        expect(accessControl.can('event.visible', { event: '2024', team: 'hosts' })).toBeFalse();

        expect(accessControl.can('event.visible', { event: kEveryEvent, team: 'crew' })).toBeTrue();
        expect(accessControl.can('event.visible', { event: kEveryEvent, team: 'hosts' }))
            .toBeFalse();
    });
});
