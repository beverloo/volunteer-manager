// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';
import type { NextRouterParams } from '@lib/NextRouterParams';
import db, { tEvents } from '@lib/database';

/**
 * Cache event titles for the duration of this instance.
 */
const kTitleCache = new Map();

/**
 * Generates metadata for one of the sub-pages of a particular event based on the given `title`,
 * and the `props` which include the event's slug. Will cause a database query.
 */
async function generateMetadata(props: NextRouterParams<'slug'>, title?: string)
    : Promise<Metadata>
{
    const { slug } = props.params;

    if (slug && slug.length > 0 && !kTitleCache.has(slug)) {
        const event = await db.selectFrom(tEvents)
            .select({ shortName: tEvents.eventShortName })
            .where(tEvents.eventSlug.equals(slug))
            .executeSelectNoneOrOne();

        if (event)
            kTitleCache.set(slug, event.shortName);
    }

    return {
        title: [
            title,
            kTitleCache.get(slug),
            'AnimeCon Volunteer Manager',

        ].filter(Boolean).join(' | '),
    };
}

/**
 * Generates a `generateMetadata` compatible-function for an event with the given `title`.
 */
export function generateEventMetadataFn(title?: string) {
    return (props: NextRouterParams<'slug'>) => generateMetadata(props, title);
}
