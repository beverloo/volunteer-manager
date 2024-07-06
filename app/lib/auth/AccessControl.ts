// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import type { BooleanPermission, CRUDPermission } from './Access';
import { expandPermissionGroup, getPermissionType } from './Access';

/**
 * CRUD-described operations that can happen based on a permission.
 */
type Operation = 'create' | 'read' | 'update' | 'delete';

/**
 * Information about the permission grants that have been given to the visitor. This includes both
 * grants, and specific control to which team(s) the visitor has access. Each value takes a list of
 * values, separated by commas.
 */
interface Grants {
    /**
     * Events that access should be granted to. By default no events are accessible, although some
     * permissions may not be associated with a particular event. Certain permissions may be granted
     * specific to a given event based on Senior-level access.
     */
    events?: string;

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

    /**
     * Teams that access should be granted to. By default no teams are accessible, although certain
     * permissions may be granted specific to a given team based on Senior-level access.
     */
    teams?: string;
}

/**
 * Further options that can be provided to the access control mechanism.
 */
interface Options {
    /**
     * Event that the permission check is in scope for. Permission-specific grants and revocations
     * will be considered first, after which global access will be considered.
     */
    event?: string;

    /**
     * Team that the permission check is in scope for. Permission-specific grants and revocations
     * will be considered first, after which global access will be considered.
     */
    team?: string;
}

/**
 * Value that represents that every event is in scope for a grant.
 */
export const kEveryEvent = '*';

/**
 * Value that represents that every team is in scope for a grant.
 */
export const kEveryTeam = '*';

/**
 * Pattern that defines the valid syntax for an individual permission, which are single-word alpha-
 * numeric sequences separated by a period. (E.g. "foo.bar.baz".)
 *
 * @visible Exclusively for testing purposes.
 */
export const kPermissionPattern = /^[a-z][\w-]*(?:\.[\w-]+)*(?:\:(create|read|update|delete))*$/;

/**
 * Contextualized information stored regarding a granted (or revoked) permission.
 */
interface Permission {
    // TODO: `eventsWithTeam` (?)
    // TODO: `events`
    // TODO: `teams`
}

/**
 * Map of permission names with their associated `Permission` instances.
 */
type PermissionMap = Map<string, Permission>;

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
    #events: Set<string> | undefined;
    #grants: PermissionMap;
    #revokes: PermissionMap;
    #teams: Set<string> | undefined;
    // TODO: isValid?

    constructor(grants: Grants) {
        this.#grants = this.createGrantSetFromInput(grants.grants);
        this.#revokes = this.createGrantSetFromInput(grants.revokes);

        if (!!grants.events && !!grants.events.length)
            this.#events = new Set<string>(grants.events.split(','));

        if (!!grants.teams && !!grants.teams.length)
            this.#teams = new Set<string>(grants.teams.split(','));
    }

    /**
     * Creates a new grant Map for the given `input`, when any has been provided. The input is
     * expected to be a comma separated list of permissions. Each entry will be verified, and will
     * result in a warning message when invalid input is seen.
     */
    private createGrantSetFromInput(input: string | undefined) {
        const grants: PermissionMap = new Map;
        if (typeof input !== 'string')
            return grants;

        const expandedPermissions =
            input.split(',').map(permission => expandPermissionGroup(permission)).flat();

        for (const permission of expandedPermissions) {
            if (!kPermissionPattern.test(permission)) {
                console.warn(`Invalid syntax for the given grant: "${permission}" (ignoring)`);
                continue;
            }

            grants.set(permission, { /* no permission-level modifiers are applicable */ });
        }

        return grants;
    }

    /**
     * Returns whether the given `permission` is applicable for a check with the given `options`.
     */
    private isPermissionApplicable(permission?: Permission, options?: Options): boolean {
        if (!!options?.event) {
            // TODO: Confirm event access specific to the given `permission`.

            if (!this.#events?.has(options.event) && !this.#events?.has(kEveryEvent))
                return false;
        }

        if (!!options?.team) {
            // TODO: Confirm team access specific to the given `permission`.

            if (!this.#teams?.has(options.team) && !this.#teams?.has(kEveryTeam))
                return false;
        }

        return !!permission;
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

        let options: Options | undefined;

        if (getPermissionType(permission) === 'crud') {
            if (typeof second !== 'string')
                throw new Error(`Invalid operation given for a CRUD permission: "${second}"`);

            const scope = `${permission}:${second}`;

            const maybeRevoked = this.#revokes.get(scope);
            if (this.isPermissionApplicable(maybeRevoked, third))
                return false;  // permission+scope has been explicitly revoked

            const maybeGranted = this.#grants.get(scope);
            if (this.isPermissionApplicable(maybeGranted, third))
                return true;  // permission+scope has been explicitly granted

            options = third;
        } else {
            options = second;
        }

        const path = permission.split('.');
        do {
            const scope = path.join('.');

            const maybeRevoked = this.#revokes.get(scope);
            if (this.isPermissionApplicable(maybeRevoked, options))
                return false;  // (scoped) permission has been explicitly revoked

            const maybeGranted = this.#grants.get(scope);
            if (this.isPermissionApplicable(maybeGranted, options))
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
