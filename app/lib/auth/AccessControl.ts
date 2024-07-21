// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import type { AccessDescriptor, AccessOperation } from './AccessDescriptor';
import type { AccessScope, Grant, Result } from './AccessList';
import type { BooleanPermission, CRUDPermission } from './Access';
import { AccessList, kAnyEvent, kAnyTeam } from './AccessList';
import { kPermissionGroups, kPermissions } from './Access';

/**
 * Re-export types from the underlying `AccessList` mechanism that are useful elsewhere.
 */
export type { AccessScope, Grant };
export { kAnyEvent, kAnyTeam };

/**
 * Pattern that defines the valid syntax for an individual permission, which are single-word alpha-
 * numeric sequences separated by a period. (E.g. "foo.bar.baz".)
 *
 * @visible Exclusively for testing purposes.
 */
export const kPermissionPattern = /^[a-z][\w-]*(?:\.[\w-]+)*(?:\:(create|read|update|delete))*$/;

// -------------------------------------------------------------------------------------------------

/**
 * Parameters that can be passed to the `AccessControl` constructor, defining the input information
 * necessary to fully define the scope of access for a particular user.
 */
export type AccessControlParams = {
    /**
     * Permissions that have been granted to the user, if any. These are in addition to implicit
     * grants based on event-level allocations, i.e. by being assigned to a Senior-level position.
     */
    grants?: Grant | Grant[];

    /**
     * Permissions that have been revoked for the user, if any. These take precedent over both
     * explicit grants, and implicit grants based on event-level allocations.
     */
    revokes?: Grant | Grant[];

    /**
     * Events that access should be granted to. By default no events are accessible, although some
     * permissions may not be associated with a particular event. Certain permissions may be granted
     * specific to a given event based on Senior-level access.
     */
    events?: string;

    /**
     * Teams that access should be granted to. By default no teams are accessible, although certain
     * permissions may be granted specific to a given team based on Senior-level access.
     */
    teams?: string;
};

/**
 * Result that will be issued from an `AccessControl` query when the requested permission was found
 * to exist on either the grant or revocation access lists.
 */
type AccessResult = Result & {

};

// -------------------------------------------------------------------------------------------------

/**
 * Contextualized information stored regarding a granted (or revoked) permission.
 */
interface Permission {
    /**
     * Events that this permission is scoped to, if any. This is in addition to global access.
     */
    events?: Set<string>;

    /**
     * Teams that this permission is scoped to, if any. This is in addition to global access.
     */
    teams?: Set<string>;
}

/**
 * Map of permission names with their associated `Permission` instances.
 */
type PermissionMap = Map<string, Permission>;

/**
 * Status that can be associated with a particular permission type.
 */
export type PermissionStatus =
    'crud-granted' | 'crud-revoked' | 'parent-granted' | 'parent-revoked' |
    'self-granted' | 'self-revoked' | 'unset';

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
    #grantMap: PermissionMap = new Map;
    #grants: AccessList;

    #revokeMap: PermissionMap = new Map;
    #revokes: AccessList;

    #events: Set<string> | undefined;
    #teams: Set<string> | undefined;

    constructor(grants: AccessControlParams) {
        this.#revokes = new AccessList({ grants: grants.revokes })
        this.#grants = new AccessList({
            grants: grants.grants,
            events: grants.events,
            teams: grants.teams,
        });

        if (!!grants.grants) {
            const grantArray = Array.isArray(grants.grants) ? grants.grants : [ grants.grants ];
            for (const grant of grantArray)
                this.populatePermissionMapFromInput(this.#grantMap, grant);
        }

        if (!!grants.revokes) {
            const revokeArray = Array.isArray(grants.revokes) ? grants.revokes : [ grants.revokes ];
            for (const revoke of revokeArray)
                this.populatePermissionMapFromInput(this.#revokeMap, revoke);
        }

        if (!!grants.events && !!grants.events.length)
            this.#events = new Set<string>(grants.events.split(','));

        if (!!grants.teams && !!grants.teams.length)
            this.#teams = new Set<string>(grants.teams.split(','));
    }

    /**
     * Checks whether the given `permission` has been granted. Optionally, a `scope` may be given
     * which adds additional granularity to the check, as permissions don't have to be granted for
     * every event and team. CRUD-based permissions require an `operation` to be specified.
     *
     * Permission checks are hierarchical, which means that someone granted the "event" permission
     * also has access to the "event.visible" permission. These checks are done in order of highest
     * specificity, to make sure that the most specific grant (and/or revoke) will be considered.
     */
    can(permission: BooleanPermission, scope?: AccessScope): boolean;
    can(permission: CRUDPermission, operation: AccessOperation, scope?: AccessScope): boolean;
    can(permission: BooleanPermission | CRUDPermission, second?: any, third?: any): boolean {
        const status = this.getStatus(permission as any, second, third);
        switch (status) {
            case 'crud-granted':
            case 'parent-granted':
            case 'self-granted':
                return true;

            case 'crud-revoked':
            case 'parent-revoked':
            case 'self-revoked':
            case 'unset':
                return false;
        }

        throw new Error(`Unrecognised permission status: "${status}"`);
    }

    /**
     * Queries the status of the given `permission`, which contains full information on why the
     * permission was either granted or revoked, if set at all. Optionally, a `scope` may be given
     * which adds additional granularity to the query, as permissions don't have to be granted for
     * every event and team. CRUD-based permissions require an `operation` to be specified.
     *
     * Permission queries are hierarchical, which means that someone granted the "event" permission
     * also has access to the "event.visible" permission. These queries are done in order of highest
     * specificity, to make sure that the most specific grant (and/or revoke) will be considered.
     */
    query(permission: BooleanPermission, scope?: AccessScope): AccessResult | undefined;
    query(permission: CRUDPermission, operation: AccessOperation, scope?: AccessScope)
        : AccessResult | undefined;
    query(permission: BooleanPermission | CRUDPermission, second?: any, third?: any)
        : AccessResult | undefined
    {
        // TODO: Implement this method.
        return undefined;
    }

    /**
     * Requires that the given `permission` has been granted, or throw a Next.js exception that will
     * yield an HTTP 403 Forbidden error to be shown instead of the requested content. Optionally, a
     * `scope` may be given which adds additional granularity to the query, as permissions don't
     * have to be granted for every event and team. CRUD-based permissions require an `operation` to
     * be specified.
     *
     * Permission queries are hierarchical, which means that someone granted the "event" permission
     * also has access to the "event.visible" permission. These queries are done in order of highest
     * specificity, to make sure that the most specific grant (and/or revoke) will be considered.
     *
     * @todo Actually throw a HTTP 403 Forbidden error when Next.js supports it.
     */
    require(permission: BooleanPermission, scope?: AccessScope): void;
    require(permission: CRUDPermission, operation: AccessOperation, scope?: AccessScope): void;
    require(permission: BooleanPermission | CRUDPermission, second?: any, third?: any): void {
        if (!this.can(permission as any, second, third))
            notFound();
    }

    // ---------------------------------------------------------------------------------------------

    /**
     * Returns the permission status for the given permission, which gives more information about
     * why it would be granted or revoked. Generally this information is not important, and either
     * the `can()` or `require()` methods should be used instead.
     *
     * Permission checks will be highly specific at first, to ensure that someone who is granted the
     * "foo" permission can still have "foo.bar" explicitly revoked. CRUD permissions will be
     * expanded separately at the deepest scope.
     */
    getStatus(permission: BooleanPermission, scope?: AccessScope): PermissionStatus;
    getStatus(permission: CRUDPermission, operation: AccessOperation, scope?: AccessScope)
        : PermissionStatus;
    getStatus(permission: BooleanPermission | CRUDPermission, second?: any, third?: any)
        : PermissionStatus
    {
        if (!kPermissionPattern.test(permission))
            throw new Error(`Invalid syntax for the given permission: "${permission}"`);

        if (!Object.hasOwn(kPermissions, permission))
            throw new Error(`Unrecognised permission: "${permission}"`);

        const descriptor: AccessDescriptor = kPermissions[permission];
        const accessScope: AccessScope | undefined = descriptor.type === 'crud' ? third : second;

        if (descriptor.requireEvent && !accessScope?.event)
            throw new Error(`Event is required when checking "${permission}" access`);

        if (descriptor.requireTeam && !accessScope?.team)
            throw new Error(`Team is required when checking "${permission}" access`);

        if (descriptor.type === 'crud') {
            if (typeof second !== 'string')
                throw new Error(`Invalid operation given for a CRUD permission: "${second}"`);

            const scope = `${permission}:${second}`;

            const maybeRevoked = this.#revokeMap.get(scope);
            if (maybeRevoked && this.isRevokeApplicable(maybeRevoked, third))
                return 'crud-revoked';  // permission + scope has been explicitly revoked

            const maybeGranted = this.#grantMap.get(scope);
            if (maybeGranted && this.isGrantApplicable(maybeGranted, third))
                return 'crud-granted';  // permission + scope has been explicitly granted
        }

        const path = permission.split('.');
        do {
            const scope = path.join('.');
            const isParent = scope !== permission;

            const maybeRevoked = this.#revokeMap.get(scope);
            if (maybeRevoked && this.isRevokeApplicable(maybeRevoked, accessScope))
                return isParent ? 'parent-revoked' : 'self-revoked';  // explicitly revoked

            const maybeGranted = this.#grantMap.get(scope);
            if (maybeGranted && this.isGrantApplicable(maybeGranted, accessScope))
                return isParent ? 'parent-granted' : 'self-granted';  // explicitly granted

            path.pop();

        } while (!!path.length);

        return 'unset';  // no permission has been granted
    }

    // ---------------------------------------------------------------------------------------------

    /**
     * Populates the given `target` map with permissions sourced from the given `input`, which
     * contain a comma-separated list of permissions, and optionally scoping to a specific event
     * and/or team. No information will be returned from this method.
     */
    private populatePermissionMapFromInput(target: PermissionMap, input: Grant): void {
        const permissions = typeof input === 'string' ? input : input.permission;
        const expandedPermissions =
            permissions.split(',').map(perm => kPermissionGroups[perm] ?? perm).flat();

        for (const permission of expandedPermissions) {
            if (!kPermissionPattern.test(permission)) {
                console.warn(`Invalid syntax for the given grant: "${permission}" (ignoring)`);
                continue;
            }

            let event: string | undefined;
            let team: string | undefined;

            if (typeof input !== 'string') {
                if (!!input.event)
                    event = input.event;

                if (!!input.team)
                    team = input.team;
            }

            const existingPermission = target.get(permission);
            if (existingPermission === undefined) {
                target.set(permission, {
                    events: event ? new Set([ event ]) : undefined,
                    teams: team ? new Set([ team ]) : undefined,
                });

                continue;
            }

            if (!!event) {
                if (!existingPermission.events)
                    existingPermission.events = new Set([ event ]);
                else
                    existingPermission.events.add(event);
            }

            if (!!team) {
                if (!existingPermission.teams)
                    existingPermission.teams = new Set([ team ]);
                else
                    existingPermission.teams.add(team);
            }
        }
    }

    /**
     * Returns whether the given `permission` is an applicable grant considering scoping information
     * given in `options`. Global event and team access will be considered.
     */
    private isGrantApplicable(permission: Permission, scope?: AccessScope) {
        if (!!scope?.event && scope.event !== kAnyEvent) {
            if (!this.#events?.has(kAnyEvent)) {
                if (!permission.events?.has(scope.event) && !this.#events?.has(scope.event))
                    return false;  // event access has not been granted
            }
        }

        if (!!scope?.team && scope.team !== kAnyEvent) {
            if (!this.#teams?.has(kAnyEvent)) {
                if (!permission.teams?.has(scope.team) && !this.#teams?.has(scope.team))
                    return false;  // team access has not been granted
            }
        }

        return true;
    }

    /**
     * Returns whether the given `permission` is an applicable revocation considering scoping
     * information given in `options`. Global event and team access will be not be considered, as
     * revokes are exclusionary for something that could be granted.
     */
    private isRevokeApplicable(permission: Permission, scope?: AccessScope) {
        if (!!permission.events?.size && !!scope?.event) {
            if (!permission.events.has(scope.event))
                return false;  // event access has not been revoked
        }

        if (!!permission.teams?.size && !!scope?.team) {
            if (!permission.teams.has(scope.team))
                return false;  // team access has not been revoked
        }

        return true;
    }
}
