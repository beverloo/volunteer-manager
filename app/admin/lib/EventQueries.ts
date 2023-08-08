// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type AdminHeaderEventEntry } from '../AdminHeader';
import { Privilege, can } from '@app/lib/auth/Privileges';
import { User } from '@lib/auth/User';
import { sql } from '@lib/database';

/**
 * Retrieves the events to display in the administration area header that the given `user` has
 * access to. Should be limited to the four most recent events they had a role in at most.
 */
export async function getHeaderEventsForUser(user: User): Promise<AdminHeaderEventEntry[]> {
    const kUrlPrefix = '/admin/events/';

    const adminAccess = can(user, Privilege.AccessPastEvents);
    const result =
        await sql`
            SELECT
                events.event_short_name,
                events.event_slug,
                IF(events.event_end_time < NOW(), 1, 0) AS done
            FROM
                events
            LEFT JOIN
                users_events ON users_events.event_id = events.event_id AND
                                users_events.user_id = ${user.userId}
            LEFT JOIN
                roles ON roles.role_id = users_events.role_id
            WHERE
                roles.role_admin_access = 1 OR ${adminAccess}
            ORDER BY
                events.event_end_time DESC
            LIMIT
                4`;

    if (!result.ok || !result.rows.length)
        return [ /* no events are accessible */ ];

    const events: AdminHeaderEventEntry[] = [];
    for (const row of result.rows) {
        events.push({
            done: !!row.done,
            label: row.event_short_name,
            url: `${kUrlPrefix}${row.event_slug}`,
        });
    }

    return events;
}
