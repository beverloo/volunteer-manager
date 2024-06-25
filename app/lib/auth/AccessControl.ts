// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { BooleanPermission, CRUDPermission } from './Access';

/**
 * CRUD-described operations that can happen based on a permission.
 */
type CRUDOperation = 'create' | 'read' | 'update' | 'delete';

/**
 * Information about the permission grants that have been given to the visitor. This includes both
 * grants, and specific control to which team(s) the visitor has access.
 */
interface Grants {
    // TODO: Add grants
}

/**
 * Further options that can be provided to the access control mechanism.
 */
interface Options {
    // TODO: Add options
}

/**
 * The `AccessControl` object enables consistent access checks throughout the Volunteer Manager
 * system. Our permissions are hierarchical, resource-based and follow CRUD patterns. Furthermore,
 * the permissions themselves are predefined in the `Access.ts` file.
 */
export class AccessControl {
    constructor(grants: Grants) {
        // TODO
    }

    /**
     * Checks whether the visitor has access to the given `permission`. When the `permission` is a
     * CRUD-based permission, the operation must be specified. A set of options may be given when
     * applicable, to enable further fine-grained access control at the resource level.
     */
    can(permission: BooleanPermission, options?: Options): boolean;
    can(permission: CRUDPermission, operation: CRUDOperation, options?: Options): boolean;
    can(permission: BooleanPermission | CRUDPermission, second?: any, third?: any): boolean {
        return false;  // TODO
    }

    /**
     * Requires that the visitor has access to the given `permission`, or throws an exception that
     * will result in a HTTP 403 Forbidden error page. When the `permission` is a CRUD-based
     * permission, the operation must be specified. A set of options may be given when applicable,
     * to enable further fine-grained access control at the resource level.
     *
     * @todo Actually throw a HTTP 403 Forbidden error when Next.js supports it.
     */
    require(permission: BooleanPermission, options?: Options): void;
    require(permission: CRUDPermission, operation: CRUDOperation, options?: Options): void;
    require(permission: BooleanPermission | CRUDPermission, second?: any, third?: any): void {
        // TODO
    }
}
