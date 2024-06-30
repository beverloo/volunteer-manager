// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// !!                                                                                             !!
// !!    When updating permissions in this file, make sure to also update AccessDescriptors.ts    !!
// !!                                                                                             !!
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

// -------------------------------------------------------------------------------------------------
// Boolean permissions
// -------------------------------------------------------------------------------------------------

/**
 * Permissions that are boolean-based, i.e. they're either granted, or they're not.
 */
enum BooleanPermissions {
    // Namespace: `test`
    TestBooleanPermission = 'test.boolean',
};

/**
 * Type containing all the permissions available for boolean operations.
 */
export type BooleanPermission = `${BooleanPermissions}`;

// -------------------------------------------------------------------------------------------------
// CRUD permissions
// -------------------------------------------------------------------------------------------------

/**
 * Permissions that are CRUD-based, i.e. have different states depending on whether data is being
 * created, read, updated or deleted. Individual operations can be both granted and/or revoked.
 */
enum CRUDPermissions {
    // Namespace: `test`
    TestCRUDPermission = 'test.crud',
};

/**
 * Type containing all the permissions available for CRUD operations.
 */
export type CRUDPermission = `${CRUDPermissions}`;

// -------------------------------------------------------------------------------------------------
// Permission groups
// -------------------------------------------------------------------------------------------------

/**
 * Expands the given `permission` into a set of permission in case this is applicable. This allows
 * the "admin" group to expand into each of the individual namespaces, for example.
 */
export function expandPermissionGroup(permission: string): string | string[] {
    switch (permission) {
        case 'admin':
            return [ 'test' ];
    }

    return permission;
}

// -------------------------------------------------------------------------------------------------

/**
 * Cache sets of the defined permissions on the global scope, to allow fast lookup of the particular
 * type of permission may be indicated by a given value.
 */
const kBooleanPermissionSet = new Set<string>(Object.values(BooleanPermissions));
const kCRUDPermissionSet = new Set<string>(Object.values(CRUDPermissions));

/**
 * Returns whether the given `permission` is a boolean or a CRUD permission, if any at all. When
 * the given `permission` is not known to the system, `undefined` will be returned instead.
 */
export function getPermissionType(permission: unknown): 'boolean' | 'crud' | undefined {
    if (typeof permission === 'string') {
        if (kBooleanPermissionSet.has(permission))
            return 'boolean';

        if (kCRUDPermissionSet.has(permission))
            return 'crud';
    }

    return undefined;
}
