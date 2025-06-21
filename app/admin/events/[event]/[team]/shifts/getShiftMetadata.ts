// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import db, { tActivities, tActivitiesLocations, tShiftsCategories } from '@lib/database';

/**
 * Returns the activities, locations and shift categories that can be selected when creating or
 * updating one of the existing shifts. Shared between multiple pages.
 */
export async function getShiftMetadata(festivalId?: number) {
    const activities = await db.selectFrom(tActivities)
        .select({
            id: tActivities.activityId,
            label: tActivities.activityTitle,
        })
        .where(tActivities.activityFestivalId.equals(festivalId ?? -1))
            .and(tActivities.activityDeleted.isNull())
        .orderBy('label', 'asc')
        .executeSelectMany();

    const categories = await db.selectFrom(tShiftsCategories)
        .select({
            id: tShiftsCategories.shiftCategoryId,
            label: tShiftsCategories.shiftCategoryName,
        })
        .where(tShiftsCategories.shiftCategoryDeleted.isNull())
        .orderBy(tShiftsCategories.shiftCategoryOrder, 'asc')
        .executeSelectMany();

    const locations = await db.selectFrom(tActivitiesLocations)
        .select({
            id: tActivitiesLocations.locationId,
            label: tActivitiesLocations.locationDisplayName.valueWhenNull(
                tActivitiesLocations.locationName),
        })
        .where(tActivitiesLocations.locationFestivalId.equals(festivalId ?? -1))
            .and(tActivitiesLocations.locationDeleted.isNull())
        .orderBy('label', 'asc')
        .executeSelectMany();

    return { activities, categories, locations };
}
