// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

/**
 * Type definition for a grant, which can either be an individual grant without scope, or one that
 * is scoped to a particular event and/or team.
 */
export type Grant = string | { permission: string; event?: string; team?: string; }

// -------------------------------------------------------------------------------------------------

/**
 * Parameters that can be passed to the constructor of the `AccessList` component.
 */
interface AccessListParams {
    /**
     * Permission group expansions that should be adhered to by the AccessList.
     */
    expansions?: Record<string, string[]>;

    /**
     * Grants that are in scope for this access list.
     */
    grants?: Grant | Grant[];
}

/**
 * Access definition for each of the grants the `AccessList` is constructed with.
 */
interface Access {
    /**
     * Whether the access was included because of an expanded permission group.
     */
    expanded: boolean;

    // TODO: Global?
    // TODO: Scopes
}

/**
 * Options that can be given when querying to see if a grant is included on the AccessList.
 */
interface Options {
    /**
     * Event that the access query should be scoped to.
     */
    event?: string;

    /**
     * Team that the access query should be scoped to.
     */
    team?: string;
}

/**
 * Result that will be issued from a permission query, if any.
 */
interface Result {
    /**
     * Whether the access was included because of an expanded permission group.
     */
    expanded: boolean;
}

// -------------------------------------------------------------------------------------------------

/**
 * The access list takes a sequence of grants (defined by the `Grant` type) and enables queries to
 * be ran against those grants, to understand whether they are captured by this access list. Access
 * lists can be used to track both positive grants and revokes.
 */
export class AccessList {
    #access: Map<string, Access> = new Map;
    #events: Set<string> = new Set;
    #teams: Set<string> = new Set;

    constructor(params?: AccessListParams) {
        if (!!params?.grants) {
            const grants = Array.isArray(params.grants) ? params.grants : [ params.grants ];

            for (const stringOrObjectGrant of grants) {
                const grant =
                    typeof stringOrObjectGrant === 'string' ? { permission: stringOrObjectGrant }
                                                            : stringOrObjectGrant;

                const seen = new Set<string>();
                const permissions = grant.permission.split(',').map(permission => ({
                    expanded: false,
                    permission,
                }));

                for (const { expanded, permission } of permissions) {
                    if (seen.has(permission))
                        continue;  // the permission has already been processed

                    seen.add(permission);

                    if (params.expansions && Object.hasOwn(params.expansions, permission)) {
                        for (const expandedPermission of params.expansions[permission])
                            permissions.push({ expanded: true, permission: expandedPermission });
                    }

                    this.#access.set(permission, { expanded });
                }
            }
        }

        // TODO: events
        // TODO: teams
    }

    /**
     * Queries whether the `permission` is included in this access list, optionally with the given
     * `options` that can further scope the check. This is a fast O(k) operation, where `k` is the
     * number of grants that were issued for the given `permission`.
     *
     * @param permission The permission to run a query for.
     * @param options Additional scoping to apply to the query.
     * @returns Result of the query, or undefined when not granted.
     */
    query(permission: string, options?: Options): Result | undefined {
        const access = this.#access.get(permission);
        if (!access)
            return undefined;

        return {
            expanded: access.expanded,
        };
    }
}
