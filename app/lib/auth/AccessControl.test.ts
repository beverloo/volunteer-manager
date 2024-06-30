// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { AccessControl, kPermissionPattern } from './AccessControl';

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
            grants: 'test.crud:create,test.crud:read',
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
            revokes: 'test.crud:delete',
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
        const accessControl = new AccessControl({ /* no grants */ });

        expect(() => accessControl.require('test.boolean')).toThrow();
    });
});
