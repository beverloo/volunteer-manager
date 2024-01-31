// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import type { NextRouterParams } from '@lib/NextRouterParams';
import { ActivityDataTable, type ActivityDataTableEntry } from './ActivityDataTable';
import { ActivityType } from '@lib/database/Types';
import { getAnPlanActivityUrl } from '@lib/AnPlan';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import db, { tActivities, tActivitiesLocations, tActivitiesTimeslots, tShifts } from '@lib/database';

/**
 * Fetches the activity entries for the given `festivalId` from the database.
 */
async function fetchActivityEntries(festivalId: number): Promise<ActivityDataTableEntry[]> {
    const activitiesLocationsJoin = tActivitiesLocations.forUseInLeftJoin();
    const activitiesTimeslotsJoin = tActivitiesTimeslots.forUseInLeftJoin();
    const shiftsJoin = tShifts.forUseInLeftJoin();

    const dbInstance = db;
    const activities = await dbInstance.selectFrom(tActivities)
        .leftJoin(activitiesTimeslotsJoin)
            .on(activitiesTimeslotsJoin.activityId.equals(tActivities.activityId))
        .leftJoin(activitiesLocationsJoin)
            .on(activitiesLocationsJoin.locationId.equals(
                activitiesTimeslotsJoin.timeslotLocationId))
        .leftJoin(shiftsJoin)
            .on(shiftsJoin.shiftActivityId.equals(tActivities.activityId))
        .where(tActivities.activityFestivalId.equals(festivalId))
            .and(tActivities.activityDeleted.isNull())
        .select({
            id: tActivities.activityId,
            title: tActivities.activityTitle,
            type: tActivities.activityType,

            timeslots: dbInstance.aggregateAsArray({
                locationId: activitiesLocationsJoin.locationId,
                locationName: activitiesLocationsJoin.locationDisplayName.valueWhenNull(
                    activitiesLocationsJoin.locationName),
            }),

            helpRequested: tActivities.activityHelpNeeded,
            shiftScheduled: dbInstance.countDistinct(shiftsJoin.shiftId),
            visible: tActivities.activityVisible,
        })
        .groupBy(tActivities.activityId)
        .orderBy(tActivities.activityTitle, 'asc')
        .executeSelectMany();

    return activities.map(activity => {
        let anplanLink: string | undefined;
        if (activity.type === ActivityType.Program)
            anplanLink = getAnPlanActivityUrl(activity.id);

        let location: string;
        let locationId: number | undefined;

        if (!activity.timeslots.length) {
            location = 'No locations…';
        } else {
            const uniqueLocations = new Set<number>();
            for (const { locationId, locationName } of activity.timeslots)
                uniqueLocations.add(locationId);

            if (uniqueLocations.size === 1) {
                location = activity.timeslots[0].locationName;
                locationId = activity.timeslots[0].locationId;
            } else {
                location = `${uniqueLocations.size} locations`;
            }
        }

        return {
            id: activity.id,
            title: activity.title,
            location,
            locationId,
            timeslots: activity.timeslots.length,
            helpRequested: !!activity.helpRequested,
            shiftScheduled: !!activity.shiftScheduled,
            visible: !!activity.visible,
            anplanLink,
        }
    });
}

/**
 * The <ProgramActivitiesPage> component contains the activities that are part of the program of a
 * particular event. Each activity can link through to a detail page.
 */
export default async function ProgramActivitiesPage(props: NextRouterParams<'slug'>) {
    const { event } = await verifyAccessAndFetchPageInfo(props.params);
    if (!event.festivalId)
        notFound();

    const activities = await fetchActivityEntries(event.festivalId);
    return <ActivityDataTable activities={activities} />;
}
