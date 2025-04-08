// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import db, { tActivities, tActivitiesTimeslots } from '@lib/database';

/**
 * Fetches the timeslots for the given `activities` from the database.
 */
export async function getTimeslotsForActivities(activities: number[]) {
    return db.selectFrom(tActivities)
        .innerJoin(tActivitiesTimeslots)
            .on(tActivitiesTimeslots.activityId.equals(tActivities.activityId))
        .where(tActivities.activityId.in(activities))
            .and(tActivities.activityDeleted.isNull())
            .and(tActivitiesTimeslots.timeslotDeleted.isNull())
        .select({
            id: tActivitiesTimeslots.timeslotId,
            start: tActivitiesTimeslots.timeslotStartTime,
            end: tActivitiesTimeslots.timeslotEndTime,
        })
        .executeSelectMany();
}
