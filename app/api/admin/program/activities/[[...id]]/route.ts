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
import db, { tActivities, tActivitiesLocations, tActivitiesLogs, tActivitiesTimeslots, tShifts } from '@lib/database';

/**
 * Row model of a program's activities.
 */
const kProgramActivityRowModel = z.object({
    /**
     * Unique ID of this activity.
     */
    id: z.number(),

    /**
     * Type of this activity, i.e. sourced from AnPlan or internal to our system.
     */
    type: z.nativeEnum(ActivityType),

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
 * Offset to use for internal Activity IDs, to avoid overlap with AnPlan data.
 */
const kInternalActivityIdOffset = 10_000_000;

/**
 * The Program Activities API is implemented as a regular DataTable API.
 * The following endpoints are provided by this implementation:
 *
 *     DELETE /api/admin/program/activities/:id
 *     GET    /api/admin/program/activities
 *     POST   /api/admin/program/activities
 *     PUT    /api/admin/program/activities/:id
 *
 */
export const { DELETE, GET, POST, PUT } =
createDataTableApi(kProgramActivityRowModel, kProgramActivityContext, {
    async accessCheck({ context }, action, props) {
        executeAccessCheck(props.authenticationContext, {
            check: 'admin-event',
            event: context.event,
        });
    },

    async create({ context }, props) {
        const event = await getEventBySlug(context.event);
        if (!event || !event.festivalId)
            notFound();

        const highestInternalActivityId = await db.selectFrom(tActivities)
            .where(tActivities.activityId.greaterThan(kInternalActivityIdOffset))
            .selectOneColumn(tActivities.activityId)
            .orderBy(tActivities.activityId, 'desc').limit(1)
            .executeSelectNoneOrOne();

        const newInternalActivityId = (highestInternalActivityId ?? kInternalActivityIdOffset) + 1;
        const newDisplayInternalActivityId = newInternalActivityId - kInternalActivityIdOffset;

        const dbInstance = db;
        const insertedRows = await dbInstance.insertInto(tActivities)
            .set({
                activityId: newInternalActivityId,
                activityFestivalId: event.festivalId,
                activityType: ActivityType.Internal,
                activityTitle: `Internal activity #${newDisplayInternalActivityId}`,
                activityHelpNeeded: /* true= */ 1,
                activityTypeAdultsOnly: /* false= */ 0,
                activityTypeCompetition: /* false= */ 0,
                activityTypeCosplay: /* false= */ 0,
                activityTypeEvent: /* false= */ 0,
                activityTypeGameRoom: /* false= */ 0,
                activityTypeVideo: /* false= */ 0,
                activityVisible: /* false= */ 0,
                activityVisibleReason: 'Internal to the Volunteer Manager',
                activityCreated: dbInstance.currentZonedDateTime(),
                activityUpdated: dbInstance.currentZonedDateTime(),
            })
            .executeInsert();

        if (!insertedRows)
            return { success: false, error: 'Unable to write the new activity to the database…' };

        await dbInstance.insertInto(tActivitiesLogs)
            .set({
                festivalId: event.festivalId,
                activityId: newInternalActivityId,
                mutation: Mutation.Created,
                mutationSeverity: MutationSeverity.Important,
                mutationUserId: props.user?.userId,
                mutationDate: dbInstance.currentZonedDateTime(),
            })
            .executeInsert();

        return {
            success: true,
            row: {
                id: newInternalActivityId,
                type: ActivityType.Internal,
                title: `Internal activity #${newDisplayInternalActivityId}`,
                location: 'No locations…',
                timeslots: 0,
                helpRequested: true,
                shiftScheduled: false,
                visible: false,
            },
        };
    },

    async delete({ context, id }, props) {
        const event = await getEventBySlug(context.event);
        if (!event || !event.festivalId)
            notFound();

        const dbInstance = db;
        const affectedRows = await dbInstance.update(tActivities)
            .set({
                activityDeleted: dbInstance.currentZonedDateTime(),
            })
            .where(tActivities.activityFestivalId.equals(event.festivalId))
                .and(tActivities.activityId.equals(id))
                .and(tActivities.activityType.equals(ActivityType.Internal))
                .and(tActivities.activityDeleted.isNull())
            .executeUpdate();

        await dbInstance.insertInto(tActivitiesLogs)
            .set({
                festivalId: event.festivalId,
                activityId: id,
                mutation: Mutation.Deleted,
                mutationSeverity: MutationSeverity.Important,
                mutationUserId: props.user?.userId,
                mutationDate: dbInstance.currentZonedDateTime(),
            })
            .executeInsert();

        return { success: !!affectedRows };
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
                    type: activity.type,
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

    async update({ context, id, row }, props) {
        const event = await getEventBySlug(context.event);
        if (!event || !event.festivalId)
            notFound();

        return { success: false };
    },

    async writeLog({ context, id }, mutation, props) {
        return;

        const event = await getEventBySlug(context.event);
        const locationName = await db.selectFrom(tActivitiesAreas)
            .where(tActivitiesAreas.areaId.equals(id))
            .selectOneColumn(tActivitiesAreas.areaDisplayName.valueWhenNull(
                tActivitiesAreas.areaName))
            .executeSelectNoneOrOne();

        await Log({
            type: LogType.AdminProgramMutation,
            severity: LogSeverity.Warning,
            sourceUser: props.user,
            data: {
                event: event?.shortName,
                entityType: 'area',
                entity: locationName,
                mutation
            },
        });
    },
});

export const dynamic = 'force-dynamic';
