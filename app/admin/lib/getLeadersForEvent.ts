// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import db, { tRoles, tUsers, tUsersEvents } from '@lib/database';

import { kRegistrationStatus } from '@lib/database/Types';

/**
 * Returns the leaders for the given `eventId`, as an array of objects which contain the user Id as
 * the value, and the leader's display name as the label.
 */
export async function getLeadersForEvent(eventId: number) {
    return db.selectFrom(tUsersEvents)
        .innerJoin(tRoles)
            .on(tRoles.roleId.equals(tUsersEvents.roleId))
        .innerJoin(tUsers)
            .on(tUsers.userId.equals(tUsersEvents.userId))
        .where(tUsersEvents.eventId.equals(eventId))
            .and(tUsersEvents.registrationStatus.equals(kRegistrationStatus.Accepted))
            .and(tRoles.rolePermissionGrant.isNotNull())
        .select({
            value: tUsers.userId,
            label: tUsers.name,
        })
        .orderBy(tUsers.name, 'asc')
        .executeSelectMany();
}
