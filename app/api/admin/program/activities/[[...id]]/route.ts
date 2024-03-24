// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';
import { z } from 'zod';

import { type DataTableEndpoints, createDataTableApi } from '../../../../createDataTableApi';
import { ActivityType, Mutation, MutationSeverity } from '@lib/database/Types';
import { Log, LogType, LogSeverity } from '@lib/Log';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import { getAnPlanActivityUrl } from '@lib/AnPlan';
import { getEventBySlug } from '@lib/EventLoader';
import db, { tActivities, tActivitiesLocations, tActivitiesTimeslots, tShifts } from '@lib/database';

/**
 * Row model of a program's activities.
 */
const kProgramActivityRowModel = z.object({
    /**
     * Unique ID of this activity.
     */
    id: z.number(),

    /**
     * Title of the activity.
     */
    title: z.string(),

    /**
     * Location in which the activity will be hosted. May be an arbitrary string when there either
     * are multiple locations, or no locations at all.
     */
    location: z.string(),
    locationId: z.number().optional(),

    /**
     * Number of timeslots that have been scheduled for this particular activity.
     */
    timeslots: z.number(),

    /**
     * Whether volunteering help was requested by the organisers of this activity.
     */
    helpRequested: z.boolean(),

    /**
     * Whether one or more shifts have been scheduled for this activity.
     */
    shiftScheduled: z.boolean(),

    /**
     * Whether the activity is visible to the public, or private to the organisation.
     */
    visible: z.boolean(),

    /**
     * Link to this activity in AnPlan, only when it's sourced from the program.
     */
    anplanLink: z.string().optional(),
});

/**
 * Program activities are specific to a given festival.
 */
const kProgramActivityContext = z.object({
    context: z.object({
        /**
         * Name of the event which is being consulted.
         */
        event: z.string(),
    }),
});

/**
 * Export type definitions so that the API can be used in `callApi()`.
 */
export type ProgramActivitiesEndpoints =
    DataTableEndpoints<typeof kProgramActivityRowModel, typeof kProgramActivityContext>;

/**
 * Export type definition for the API's Row Model.
 */
export type ProgramActivitiesRowModel = z.infer<typeof kProgramActivityRowModel>;

/**
 * Export type definition for the API's context.
 */
export type ProgramActivitiesContext = z.infer<typeof kProgramActivityContext>;

/**
 * The Program Activities API is implemented as a regular DataTable API.
 * The following endpoints are provided by this implementation:
 *
 *     GET    /api/admin/program/activities
 */
export const { GET } =
createDataTableApi(kProgramActivityRowModel, kProgramActivityContext, {
    async accessCheck({ context }, action, props) {
        executeAccessCheck(props.authenticationContext, {
            check: 'admin-event',
            event: context.event,
        });
    },

    async list({ context, pagination, sort }) {
        const event = await getEventBySlug(context.event);
        if (!event || !event.festivalId)
            notFound();

        const activitiesLocationsJoin = tActivitiesLocations.forUseInLeftJoin();
        const activitiesTimeslotsJoin = tActivitiesTimeslots.forUseInLeftJoin();
        const shiftsJoin = tShifts.forUseInLeftJoin();

        let sortField: 'title' | 'helpRequested' | 'shiftScheduled' | 'visible' = 'title';
        const sortDirection = sort?.sort ?? 'asc';

        switch (sort?.field) {
            case 'title':
            case 'helpRequested':
            case 'shiftScheduled':
            case 'visible':
                sortField = sort.field;
                break;
        }

        const dbInstance = db;
        const activities = await dbInstance.selectFrom(tActivities)
            .leftJoin(activitiesTimeslotsJoin)
                .on(activitiesTimeslotsJoin.activityId.equals(tActivities.activityId))
            .leftJoin(activitiesLocationsJoin)
                .on(activitiesLocationsJoin.locationId.equals(
                    activitiesTimeslotsJoin.timeslotLocationId))
            .leftJoin(shiftsJoin)
                .on(shiftsJoin.shiftActivityId.equals(tActivities.activityId))
            .where(tActivities.activityFestivalId.equals(event.festivalId))
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
            .orderBy(sortField, sortDirection)
            .limitIfValue(pagination ? pagination.pageSize : null)
                .offsetIfValue(pagination ? pagination.page * pagination.pageSize : null)
            .executeSelectPage();

        return {
            success: true,
            rowCount: activities.count,
            rows: activities.data.map(activity => {
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
            }),
        };
    },
});

export const dynamic = 'force-dynamic';
