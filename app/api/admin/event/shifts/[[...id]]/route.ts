// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';
import { z } from 'zod';

import { type DataTableEndpoints, createDataTableApi } from '../../../../createDataTableApi';
import { Privilege } from '@lib/auth/Privileges';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import db, { tActivities, tEventsTeams, tEvents, tTeams, tSchedule, tShifts } from '@lib/database';

/**
 * Row model for a team's shifts. The shifts are fully mutable, even though the create and edit
 * operations don't happen in a data table.
 */
const kEventShiftRowModel = z.object({
    /**
     * Unique ID of the team as it exists in the database.
     */
    id: z.number(),

    /**
     * Name of the shifts, describing what the volunteer will be doing.
     */
    name: z.string().optional(),

    /**
     * Number of hours that volunteers have been scheduled to work on this shift.
     */
    hours: z.number().optional(),

    /**
     * Unique ID of the program activity with which this shift is associated.
     */
    activityId: z.number().optional(),

    /**
     * Name of the program activity with which this shift is associated.
     */
    activityName: z.string().optional(),

    /**
     * Excitement of this shift, indicated as a number between 0 and 1.
     */
    excitement: z.number(),
});

/**
 * This API requires the event to be known.
 */
const kEventShiftContext = z.object({
    context: z.object({
        /**
         * Unique slug of the event that the request is in scope of.
         */
        event: z.string(),

        /**
         * Unique slug of the team for whom shifts are being retrieved.
         */
        team: z.string(),
    }),
});

/**
 * Export type definitions so that the API can be used in `callApi()`.
 */
export type EventShiftEndpoints =
    DataTableEndpoints<typeof kEventShiftRowModel, typeof kEventShiftContext>;

/**
 * Export type definition for the API's Row Model.
 */
export type EventShiftRowModel = z.infer<typeof kEventShiftRowModel>;

/**
 * Export type definition for the API's context.
 */
export type EventShiftContext = z.infer<typeof kEventShiftContext>;

/**
 * Validates that the given `context` is correct, and returns an object containing both the event
 * and team information loaded from the database.
 */
async function validateContext(context: EventShiftContext['context']) {
    const result = await db.selectFrom(tEvents)
        .innerJoin(tTeams)
            .on(tTeams.teamEnvironment.equals(context.team))
        .innerJoin(tEventsTeams)
            .on(tEventsTeams.teamId.equals(tTeams.teamId))
                .and(tEventsTeams.enableTeam.equals(/* true= */ 1))
        .where(tEvents.eventSlug.equals(context.event))
        .select({
            event: {
                id: tEvents.eventId,
                festivalId: tEvents.eventFestivalId,
                name: tEvents.eventShortName,
            },
            team: {
                id: tTeams.teamId,
                name: tTeams.teamName,
            },
        })
        .groupBy(tEvents.eventId)
        .executeSelectNoneOrOne();

    return result ?? { event: undefined, team: undefined };
}

/**
 * This is implemented as a regular DataTable API. The following endpoints are provided by this
 * implementation:
 *
 *     GET    /api/admin/event/shifts
 *     DELETE /api/admin/events/shifts/:id
 *     POST   /api/admin/events/shifts
 *     PUT    /api/admin/event/shifts/:id
 */
export const { GET, PUT } = createDataTableApi(kEventShiftRowModel, kEventShiftContext, {
    async accessCheck({ context }, action, props) {
        let privilege: Privilege | undefined;
        switch (action) {
            case 'get':
            case 'list':
                break;  // no additional privilege necessary

            case 'create':
            case 'delete':
            case 'update':
                privilege = Privilege.EventShiftManagement;
                break;

            default:
                throw new Error(`Unrecognised action: ${action}`);
        }

        executeAccessCheck(props.authenticationContext, {
            check: 'admin-event',
            event: context.event,
            privilege,
        });
    },

    async create({ context, row }) {
        const { event, team } = await validateContext(context);
        if (!event || !team)
            notFound();

        return { success: false };
    },

    async delete({ context, id }) {
        const { event, team } = await validateContext(context);
        if (!event || !team)
            notFound();

        return { success: false };
    },

    async list({ context, sort }) {
        const { event, team } = await validateContext(context);
        if (!event || !team)
            notFound();

        const dbInstance = db;

        const activitiesJoin = tActivities.forUseInLeftJoin();
        const scheduleJoin = tSchedule.forUseInLeftJoin();

        const shiftDurationFragment = dbInstance.fragmentWithType('int', 'required').sql`
            TIMESTAMPDIFF(MINUTE, ${scheduleJoin.scheduleTimeStart},
                                  ${scheduleJoin.scheduleTimeEnd})`;

        const result = await dbInstance.selectFrom(tShifts)
            .leftJoin(activitiesJoin)
                .on(activitiesJoin.activityId.equals(tShifts.shiftActivityId))
                    .and(activitiesJoin.activityFestivalId.equalsIfValue(event.festivalId))
                    .and(activitiesJoin.activityDeleted.isNull())
            .leftJoin(scheduleJoin)
                .on(scheduleJoin.shiftId.equals(tShifts.shiftId))
            .where(tShifts.eventId.equals(event.id))
                .and(tShifts.teamId.equals(team.id))
            .select({
                id: tShifts.shiftId,
                name: tShifts.shiftName,
                hours: dbInstance.sum(shiftDurationFragment),
                activityId: activitiesJoin.activityId,
                activityName: activitiesJoin.activityTitle,
                excitement: tShifts.shiftExcitement,
            })
            .groupBy(tShifts.shiftId)
            .orderBy(sort?.field ?? 'name', sort?.sort ?? 'asc')
            .executeSelectMany();

        return {
            success: true,
            rowCount: result.length,
            rows: result,
        };
    },

    async update({ context, row }, props) {
        const { event, team } = await validateContext(context);
        if (!event || !team)
            notFound();

        return { success: false };
    },

    async writeLog({ context, id }, mutation, props) {
        const { event, team } = await validateContext(context);
        if (!event || !team)
            notFound();

        // TODO
    },
});
