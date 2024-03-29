// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { AdminHeaderEventEntry } from './AdminHeader';
import type { User } from '@lib/auth/User';
import { Privilege, can } from '@lib/auth/Privileges';
import db, { tEvents, tRoles, tUsersEvents } from '@lib/database';

/**
 * Retrieves the events to display in the administration area header that the given `user` has
 * access to. Should be limited to the four most recent events they had a role in at most.
 */
export async function getHeaderEventsForUser(user: User): Promise<AdminHeaderEventEntry[]> {
    const isEventAdministrator = can(user, Privilege.EventAdministrator);

    const usersEventsJoin = tUsersEvents.forUseInLeftJoin();
    const rolesJoin = tRoles.forUseInLeftJoin();

    const dbInstance = db;
    const eventEntries = await dbInstance.selectFrom(tEvents)
        .leftJoin(usersEventsJoin)
            .on(usersEventsJoin.eventId.equals(tEvents.eventId))
                .and(usersEventsJoin.userId.equals(user.userId))
        .leftJoin(rolesJoin)
            .on(rolesJoin.roleId.equals(usersEventsJoin.roleId))
        .where(rolesJoin.roleAdminAccess.equals(1).onlyWhen(!isEventAdministrator))
        .select({
            done: tEvents.eventEndTime.lessOrEquals(dbInstance.currentZonedDateTime()),
            eventShortName: tEvents.eventShortName,
            eventSlug: tEvents.eventSlug,
        })
        .orderBy(tEvents.eventEndTime, 'desc')
        .limit(4)
        .executeSelectMany();

    const events: AdminHeaderEventEntry[] = [];
    for (const row of eventEntries) {
        events.push({
            done: !!row.done,
            label: row.eventShortName,
            slug: row.eventSlug,
        });
    }

    return events;
}
