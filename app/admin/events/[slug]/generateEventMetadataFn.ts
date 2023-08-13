// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';
import { NextRouterParams } from '@lib/NextRouterParams';
import { sql } from '@lib/database';

/**
 * Cache event titles for the duration of this instance.
 */
const kTitleCache = new Map();

/**
 * Generates metadata for one of the sub-pages of a particular event based on the given `title`,
 * and the `props` which include the event's slug. Will cause a database query.
 */
async function generateMetadata(title: string, props: NextRouterParams<'slug'>): Promise<Metadata> {
    const { slug } = props.params;

    if (slug && slug.length > 0 && !kTitleCache.has(slug)) {
        const result = await sql`SELECT event_short_name FROM events WHERE event_slug = ${slug}`;
        if (result.ok && result.rows.length > 0)
            kTitleCache.set(slug, result.rows[0].event_short_name);
    }

    if (!kTitleCache.has(slug))
        return { title: `${title} | AnimeCon Volunteer Manager` };

    return { title: `${title} | ${kTitleCache.get(slug)} | AnimeCon Volunteer Manager` };
}

/**
 * Generates a `generateMetadata` compatible-function for an event with the given `title`.
 */
export function generateEventMetadataFn(title: string) {
    return (props: NextRouterParams<'slug'>) => generateMetadata(title, props);
}
