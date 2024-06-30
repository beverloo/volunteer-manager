// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import type { BooleanPermission, CRUDPermission } from './Access';
import { getPermissionType } from './Access';

/**
 * CRUD-described operations that can happen based on a permission.
 */
type Operation = 'create' | 'read' | 'update' | 'delete';

/**
 * Information about the permission grants that have been given to the visitor. This includes both
 * grants, and specific control to which team(s) the visitor has access.
 */
interface Grants {
    /**
     * Permissions that have been granted to the user, if any. These are in addition to implicit
     * grants based on event-level allocations, i.e. by being assigned to a Senior-level position.
     */
    grants?: string;

    /**
     * Permissions that have been revoked for the user, if any. These take precedent over both
     * explicit grants, and implicit grants based on event-level allocations.
     */
    revokes?: string;

    // TODO: events for event-scoped grants
    // TODO: teams for team-scoped grants
}

/**
 * Further options that can be provided to the access control mechanism.
 */
interface Options {
    // TODO: event for event-scoped checks
    // TODO: team for team-scoped checks
}

/**
 * Pattern that defines the valid syntax for an individual permission, which are single-word alpha-
 * numeric sequences separated by a period. (E.g. "foo.bar.baz".)
 *
 * @visible Exclusively for testing purposes.
 */
export const kPermissionPattern = /^[a-z][\w-]*(?:\.[\w-]+)*(?:\:(create|read|update|delete))*$/;

/**
 * The `AccessControl` object enables consistent access checks throughout the Volunteer Manager
 * system. Our permissions are hierarchical, resource-based and follow CRUD patterns. Furthermore,
 * the permissions themselves are predefined in the `Access.ts` file.
 *
 * There are two axes specific to the Volunteer Manager: grants that are scoped to a particular
 * event, and grants that are scoped to a particular team. Possibly both. This enables implicitly
 * granted permissions based on a volunteer's role in a particular event.
 *
 * Individual permissions have hierarchical names, each scope separated by a dot, with the most
 * significant scope being the left-most entry. CRUD permissions can further have modifiers on the
 * permission that indicate the scope, e.g. "foo.bar:update".
 */
export class AccessControl {
    #grants: Set<string>;
    #revokes: Set<string>;
    // TODO: isValid?

    constructor(grants: Grants) {
        this.#grants = this.createGrantSetFromInput(grants.grants);
        this.#revokes = this.createGrantSetFromInput(grants.revokes);
    }

    /**
     * Creates a new grant Set for the given `input`, when any has been provided. The input is
     * expected to be a comma separated list of permissions. Each entry will be verified, and will
     * result in a warning message when invalid input is seen.
     */
    private createGrantSetFromInput(input?: string): Set<string> {
        const grants = new Set<string>;
        if (typeof input !== 'string')
            return grants;

        for (const permission of input.split(',')) {
            if (!kPermissionPattern.test(permission)) {
                console.warn(`Invalid syntax for the given grant: "${permission}" (ignoring)`);
                continue;
            }

            grants.add(permission);
        }

        return grants;
    }

    /**
     * Checks whether the visitor has access to the given `permission`. When the `permission` is a
     * CRUD-based permission, the operation must be specified. A set of options may be given when
     * applicable, to enable further fine-grained access control at the resource level.
     *
     * Permission checks will be highly specific at first, to ensure that someone who is granted the
     * "foo" permission can still have "foo.bar" explicitly revoked. CRUD permissions will be
     * expanded separately at the deepest scope.
     */
    can(permission: BooleanPermission, options?: Options): boolean;
    can(permission: CRUDPermission, operation: Operation, options?: Options): boolean;
    can(permission: BooleanPermission | CRUDPermission, second?: any, third?: any): boolean {
        if (!kPermissionPattern.test(permission))
            throw new Error(`Invalid syntax for the given permission: "${permission}"`);

        if (getPermissionType(permission) === 'crud') {
            if (typeof second !== 'string')
                throw new Error(`Invalid operation given for a CRUD permission: "${second}"`);

            const scope = `${permission}:${second}`;

            if (this.#revokes.has(scope))
                return false;  // permission+scope has been explicitly revoked

            if (this.#grants.has(scope))
                return true;  // permission+scope has been explicitly granted
        }

        const path = permission.split('.');
        do {
            const scope = path.join('.');

            if (this.#revokes.has(scope))
                return false;  // (scoped) permission has been explicitly revoked

            if (this.#grants.has(scope))
                return true;  // (scoped) permission has been explicitly granted

            path.pop();

        } while (!!path.length);

        return false;  // no permission has been granted
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
    require(permission: CRUDPermission, operation: Operation, options?: Options): void;
    require(permission: BooleanPermission | CRUDPermission, second?: any, third?: any): void {
        if (!this.can(permission as any, second, third))
            notFound();
    }
}
