// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { toPermissionList } from './VolunteerPermissions';

describe('toPermissionList', () => {
    it('should reject invalid input', () => {
        expect(() => toPermissionList(null)).toThrow();
        expect(() => toPermissionList([ 'foo.bar' ])).toThrow();
        expect(() => toPermissionList('foo.bar')).toThrow();
    });

    it('should be able to translate boolean-based permissions to a list', () => {
        expect(toPermissionList({ admin: true })).toBe('admin');
        expect(toPermissionList({ event: { visible: true } })).toBe('event.visible');
        expect(toPermissionList({ event: { visible: false } })).toBe(null);
        expect(toPermissionList({ event: { applications: true, visible: true } }))
            .toBe('event.applications,event.visible');
        expect(toPermissionList({ event: { visible: true }, test: { boolean: true } }))
            .toBe('event.visible,test.boolean');
        expect(toPermissionList({ event: { visible: false }, test: { boolean: false } }))
            .toBe(null);
    });

    it('should be able to translate CRUD-based permissions to a list', () => {
        expect(toPermissionList({ event: { applications: { read: false } } })).toBe(null);
        expect(toPermissionList({ event: { applications: { read: true } } }))
            .toBe('event.applications:read');
        expect(toPermissionList({ event: { applications: { read: true, update: true } } }))
            .toBe('event.applications:read,event.applications:update');
        expect(toPermissionList({
            event: { applications: { create: true, read: false, update: false, delete: true } }
        })).toBe('event.applications:create,event.applications:delete');
        expect(toPermissionList({
            event: { applications: { create: true, read: true, update: true, delete: true } }
        })).toBe('event.applications');
        expect(toPermissionList({
            event: { applications: { create: false, read: false, update: false, delete: false } }
        })).toBe(null);
    });
});
