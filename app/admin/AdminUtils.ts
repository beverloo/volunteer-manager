// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { kAnyTeam, type AccessControl } from '@lib/auth/AccessControl';
import type { AdminHeaderEventEntry } from './AdminHeader';
import db, { tEvents } from '@lib/database';

/**
 * Retrieves the events to display in the administration area header that the given `user` has
 * access to. Should be limited to the four most recent events they had a role in at most.
 */
export async function getHeaderEventsForUser(access: AccessControl)
    : Promise<AdminHeaderEventEntry[]>
{
    const dbInstance = db;
    const eventEntries = await dbInstance.selectFrom(tEvents)
        .select({
            done: tEvents.eventEndTime.lessOrEquals(dbInstance.currentZonedDateTime()),
            label: tEvents.eventShortName,
            slug: tEvents.eventSlug,
        })
        .orderBy(tEvents.eventEndTime, 'desc')
        .limit(4)
        .executeSelectMany();

    const events: AdminHeaderEventEntry[] = [];
    for (const event of eventEntries) {
        if (access.can('event.visible', { event: event.slug, team: kAnyTeam }))
            events.push(event);
    }

    return events;
}
