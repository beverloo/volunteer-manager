// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

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

/**
 * Permissions that are CRUD-based, i.e. have different states depending on whether data is being
 * created, read, updated or deleted.
 */
enum CRUDPermissions {
    // Namespace: `test`
    TestCRUDPermission = 'test.crud',
};

/**
 * Type containing all the permissions available for CRUD operations.
 */
export type CRUDPermission = `${CRUDPermissions}`;
