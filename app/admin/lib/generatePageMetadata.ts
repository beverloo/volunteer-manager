// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';

import type { NextPageParams } from '@lib/NextRouterParams';
import db, { tUsers } from '@lib/database';

/**
 * Name of the product. Will be the last component in every page's title.
 */
const kProductName = 'AnimeCon Volunteer Manager';

/**
 * Cache of the values that can be loaded from the database during metadata generation.
 */
const kSpecialValueCache = {
    users: new Map<number, string>(),
};

/**
 * Value of a path component in the title that will be generated. Strings are included as-is,
 * whereas special value types are keyed by the type of value (e.g. a user account), and valued by
 * the name of the parameter that indicates the relevant unique ID.
 *
 * Special value types are:
 *
 *   { user } - the parameter must include the user ID
 */
type PathValue = string | { user: string };

/**
 * Creates a generateMetadata() function compatible with Next.js based on the given `path`. The path
 * will automatically be resolved against the parameters received from the Next.js router. Name of
 * the product does not have to be appended, that will happen automatically.
 *
 * The `path` should be included in natural order. For example, when you want the page title to end
 * up being "Settings | John Doe | Area | AnimeCon Volunteer Manager", then this function should
 * be called as such, considering that the product name will be appended automatically:
 *
 *   createGenerateMetadataFn('Settings', { user: 'id' }, 'Area');
 */
export function createGenerateMetadataFn(...path: PathValue[]) {
    return (props: NextPageParams<any>) => generateMetadata(props, path);
}

/**
 * Composes the metadata for the current page by completing the `path` with the given `props`. When
 * values are loaded from the database, they will automatically be cached indefinitely until the
 * cache is manually pruned.
 */
async function generateMetadata(props: NextPageParams<any>, path: PathValue[]): Promise<Metadata> {
    let lazyParamsInitialised: boolean = false;
    let lazyParams!: Awaited<typeof props['params']>;

    const resolvedPath = [];
    for (const component of path) {
        if (typeof component === 'string') {
            resolvedPath.push(component);
            continue;
        }

        if (!lazyParamsInitialised) {
            lazyParamsInitialised = true;
            lazyParams = await props.params;
        }

        if (component.hasOwnProperty('user')) {
            if (!lazyParams.hasOwnProperty(component.user))
                throw new Error(`The "user" parameter name does not exist: ${component.user}`);

            const id = parseInt(lazyParams[component.user], /* radix= */ 10);
            if (!Number.isSafeInteger(id))
                continue;  // silently ignore, invalid user input

            const value =
                kSpecialValueCache.users.get(id) ||
                await db.selectFrom(tUsers)
                    .where(tUsers.userId.equals(id))
                    .selectOneColumn(tUsers.name)
                    .executeSelectNoneOrOne();

            kSpecialValueCache.users.set(id, value!);
            resolvedPath.push(value!);
        }
    }

    return {
        title: [ ...resolvedPath, kProductName ].join(' | '),
    };
}

/**
 * Clears the Special Value Cache for the given `key`.
 */
export function clearPageMetadataCache(key: keyof typeof kSpecialValueCache): void {
    kSpecialValueCache[key].clear();
}
