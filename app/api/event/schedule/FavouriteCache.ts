// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { DBConnection } from '@lib/database/Connection';
import { tUsersEventsFavourites } from '@lib/database';

declare namespace globalThis {
    let animeConFavouriteCache: FavouriteCache | undefined;
}

/**
 * Implementation of a mechanism that allows favourited events to be cached in this instance of the
 * Volunteer Manager, which avoids needing database queries every time the information is needed.
 */
class FavouriteCache {
    #cache: Map<string, string[]> = new Map;

    /**
     * Clears any cached favourite activities for the given |userId|.
     */
    clear(eventId: number, userId: number): void {
        this.#cache.delete(`${userId}:${eventId}`);
    }

    /**
     * Obtains the favourited activities for the given { eventId, userId } pair. May run a database
     * query when the information has not been cached yet.
     */
    async read(dbInstance: DBConnection, eventId: number, userId: number): Promise<string[]> {
        const key = `${userId}:${eventId}`;

        const cachedValue = this.#cache.get(key);
        if (!!cachedValue)
            return cachedValue;

        const favourites = await dbInstance.selectFrom(tUsersEventsFavourites)
            .where(tUsersEventsFavourites.userId.equals(userId))
                .and(tUsersEventsFavourites.eventId.equals(eventId))
            .selectOneColumn(tUsersEventsFavourites.activityId)
            .executeSelectMany();

        const favouritesStr: string[] = favourites.map(activityId => `${activityId}`);
        this.#cache.set(key, favouritesStr);

        return favouritesStr;
    }
}

/**
 * Returns the favourite cache, which may be used to obtain the set of activities that a particular
 * user has favourited for a particular event.
 */
export function getFavouriteCache(): FavouriteCache {
    if (!globalThis.animeConFavouriteCache)
        globalThis.animeConFavouriteCache = new FavouriteCache();

    return globalThis.animeConFavouriteCache;
}
