// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import type { BooleanPermission, CRUDPermission } from './Access';
import { getPermissionType, kPermissionGroups } from './Access';

/**
 * Type definition for a grant, which can either be an individual grant without scope, or one that
 * is scoped to a particular event or team.
 */
type Grant = string | { event?: string; permission: string; team?: string; }

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
     * Permissions that have been granted to the user, if any. These are in addition to implicit
     * grants based on event-level allocations, i.e. by being assigned to a Senior-level position.
     */
    grants?: Grant | Grant[];

    /**
     * Permissions that have been revoked for the user, if any. These take precedent over both
     * explicit grants, and implicit grants based on event-level allocations.
     */
    revokes?: Grant | Grant[];

    // ---------------------------------------------------------------------------------------------

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
    #grants: PermissionMap = new Map;
    #revokes: PermissionMap = new Map;

    #events: Set<string> | undefined;
    #teams: Set<string> | undefined;

    constructor(grants: Grants) {
        if (!!grants.grants) {
            const grantArray = Array.isArray(grants.grants) ? grants.grants : [ grants.grants ];
            for (const grant of grantArray)
                this.populatePermissionMapFromInput(this.#grants, grant);
        }

        if (!!grants.revokes) {
            const revokeArray = Array.isArray(grants.revokes) ? grants.revokes : [ grants.revokes ];
            for (const revoke of revokeArray)
                this.populatePermissionMapFromInput(this.#revokes, revoke);
        }

        if (!!grants.events && !!grants.events.length)
            this.#events = new Set<string>(grants.events.split(','));

        if (!!grants.teams && !!grants.teams.length)
            this.#teams = new Set<string>(grants.teams.split(','));
    }

    /**
     * Gets the events to which access has been globally granted.
     */
    get events() { return this.#events; }

    /**
     * Gets the permissions that have been explicitly granted.
     */
    get grants() { return this.#grants.values(); }

    /**
     * Gets the permissions that have been explicitly revoked.
     */
    get revokes() { return this.#revokes.values(); }

    /**
     * Gets the teams to which access has been globally granted.
     */
    get teams() { return this.#teams; }

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
            if (this.isPermissionApplicable(maybeRevoked, third, /* globalAccess= */ false))
                return false;  // permission + scope has been explicitly revoked

            const maybeGranted = this.#grants.get(scope);
            if (this.isPermissionApplicable(maybeGranted, third, /* globalAccess= */ true))
                return true;  // permission + scope has been explicitly granted

            options = third;
        } else {
            options = second;
        }

        const path = permission.split('.');
        do {
            const scope = path.join('.');

            const maybeRevoked = this.#revokes.get(scope);
            if (this.isPermissionApplicable(maybeRevoked, options, /* globalAccess= */ false))
                return false;  // (scoped) permission has been explicitly revoked

            const maybeGranted = this.#grants.get(scope);
            if (this.isPermissionApplicable(maybeGranted, options, /* globalAccess= */ true))
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
     * Returns whether the given `permission` is applicable for a check with the given `options`.
     * When no event-specific or team-specific access has been granted, while it is being checked
     * for, the `globalAccess` argument controls whether global access grants should be considered.
     */
    private isPermissionApplicable(
        permission?: Permission, options?: Options, globalAccess?: boolean): boolean
    {
        if (!permission)
            return false;  // no permission has been granted at all

        let eventApplicable = false;
        let teamApplicable = false;

        if (!!options?.event) {
            if (options.event === kEveryEvent)
                eventApplicable = true;  // event qualification is explicitly ignored

            if (permission.events?.has(options.event))
                eventApplicable = true;  // a specific exception for this event was made

            else if (!!globalAccess) {
                if (this.#events?.has(options.event) || this.#events?.has(kEveryEvent))
                    eventApplicable = true;  // this event has not been included in the permission
            }

        } else if (!permission.events) {
            eventApplicable = true;  // no event-specific access was requested
        }

        if (!!options?.team) {
            if (options.team === kEveryTeam)
                teamApplicable = true;  // team qualification is explicitly ignored

            if (permission.teams?.has(options.team))
                teamApplicable = true;  // a specific exception for this team was made

            else if (!!globalAccess) {
                if (this.#teams?.has(options.team) || this.#teams?.has(kEveryTeam))
                    teamApplicable = true;  // this team has not been included in the permission
            }

        } else if (!permission.teams) {
            teamApplicable = true;  // no team-specific access was requested
        }

        return eventApplicable && teamApplicable;
    }

}
