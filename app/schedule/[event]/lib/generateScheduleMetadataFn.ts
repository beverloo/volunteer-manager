// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';

import type { NextPageParams } from '@lib/NextRouterParams';
import db, { tEvents } from '@lib/database';

declare module globalThis {
    let animeConScheduleEventNameCache: Map<string, string>;
}

/**
 * Cache from event slug to event short name to avoid repeated requests. May be stale when events
 * get renamed, but that can be rectified by restarting the Docker container.
 */
globalThis.animeConScheduleEventNameCache = new Map;

/**
 * Generates metadata for a page with the given `title`. A Next.js `Metadata` object will be
 * returned that can be used directly on a page.
 */
export async function generateScheduleMetadata(props: NextPageParams<'event'>, title?: string[])
    : Promise<Metadata>
{
    let eventName = globalThis.animeConScheduleEventNameCache.get(props.params.event);
    if (!eventName) {
        eventName = await db.selectFrom(tEvents)
            .where(tEvents.eventSlug.equals(props.params.event))
            .selectOneColumn(tEvents.eventShortName)
            .executeSelectNoneOrOne() ?? 'AnimeCon';

        globalThis.animeConScheduleEventNameCache.set(props.params.event, eventName);
    }

    if (!!title)
        return { title: `${title} | ${eventName}` };
    else
        return { title: eventName };
}

/**
 * Generates metadata for a page with the given `title`. A function will be returned that also reads
 * the event's slug, for which we will substitute the event's short name in the title.
 */
export function generateScheduleMetadataFn(title?: string[]) {
    return (props: NextPageParams<'event'>): Promise<Metadata> =>
        generateScheduleMetadata(props, title);
}
