// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { AccessControl, kAnyEvent, kAnyTeam, kPermissionPattern } from './AccessControl';

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
            expanded: true,
            global: true,
            scope: 'global',
        });

        expect(accessControl.query('test.boolean.required.team', scope)).not.toBeUndefined();
        expect(accessControl.query('test.boolean.required.team', scope)).toEqual({
            result: 'revoked',
            expanded: false,
            global: true,
            scope: 'global',
        });
    });

    it('should enable CRUD permissions to be granted or revoked', () => {
        const fullAccessControl = new AccessControl({
            grants: 'test.crud',
        });

        const scope = { event: kAnyEvent, team: kAnyTeam };

        expect(fullAccessControl.query('test.boolean')).toBeUndefined();
        expect(fullAccessControl.query('test.boolean.required.both', scope)).toBeUndefined();

        expect(fullAccessControl.query('test.crud', 'create')).not.toBeUndefined();
        expect(fullAccessControl.query('test.crud', 'create')).toEqual({
            result: 'granted',
            expanded: true,
            global: true,
        });

        expect(fullAccessControl.query('test.crud', 'read')).toEqual(
            fullAccessControl.query('test.crud', 'create'));
        expect(fullAccessControl.query('test.crud', 'update')).toEqual(
            fullAccessControl.query('test.crud', 'create'));
        expect(fullAccessControl.query('test.crud', 'delete')).toEqual(
            fullAccessControl.query('test.crud', 'create'));

        const partialAccessControl = new AccessControl({
            grants: 'test.crud',
            revokes: 'test.crud:delete',
        });

        expect(partialAccessControl.query('test.boolean')).toBeUndefined();
        expect(partialAccessControl.query('test.boolean.required.both', scope)).toBeUndefined();

        expect(partialAccessControl.query('test.crud', 'create')).not.toBeUndefined();
        expect(partialAccessControl.query('test.crud', 'create')).toEqual({
            result: 'granted',
            expanded: true,
            global: true,
        });

        expect(partialAccessControl.query('test.crud', 'delete')).not.toBeUndefined();
        expect(partialAccessControl.query('test.crud', 'delete')).toEqual({
            result: 'revoked',
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
            expanded: true,
            global: true,
        });

        expect(accessControl.query('test.boolean')).toEqual({
            result: 'revoked',
            expanded: false,
            global: true,
        });

        expect(accessControl.query('test.boolean.required.both', scope)).toEqual({
            result: 'revoked',
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
});
