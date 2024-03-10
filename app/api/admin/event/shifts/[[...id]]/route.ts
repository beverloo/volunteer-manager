// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';
import { z } from 'zod';

import { type DataTableEndpoints, createDataTableApi } from '../../../../createDataTableApi';
import { Log, LogSeverity, LogType } from '@lib/Log';
import { Privilege } from '@lib/auth/Privileges';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import { getShiftsForEvent } from '@app/admin/lib/getShiftsForEvent';

import db, { tActivities, tEventsTeams, tEvents, tTeams, tShifts, tShiftsCategories }
    from '@lib/database';

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
     * The colour that's assigned to this shift, calculated by the server.
     */
    colour: z.string(),

    /**
     * Name of the category that this shift is part of.
     */
    category: z.string(),

    /**
     * Order of the category as defined in the shift category overview.
     */
    categoryOrder: z.number(),

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

    // ---------------------------------------------------------------------------------------------
    // Fields only used when creating a new category, or updating an existing one:
    // ---------------------------------------------------------------------------------------------

    /**
     * Unique ID of the category in which the shift should be created.
     */
    categoryId: z.number().optional(),

    /**
     * Unique ID of the location in which the shift will be taking place.
     */
    locationId: z.number().optional(),
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
 *     DELETE /api/admin/event/shifts/:id
 *     POST   /api/admin/event/shifts
 *     PUT    /api/admin/event/shifts/:id
 */
export const { DELETE, GET, POST, PUT } =
createDataTableApi(kEventShiftRowModel, kEventShiftContext, {
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

        if (!row.categoryId)
            return { success: false, error: 'Please give the shift a category.' };

        const defaultExcitement = await db.selectFrom(tShiftsCategories)
            .where(tShiftsCategories.shiftCategoryId.equals(row.categoryId))
                .and(tShiftsCategories.shiftCategoryDeleted.isNull())
            .selectOneColumn(tShiftsCategories.shiftCategoryExcitement)
            .executeSelectOne();

        let insertId: number;
        if (!!row.activityId) {
            const activityName = await db.selectFrom(tActivities)
                .where(tActivities.activityId.equals(row.activityId))
                    .and(tActivities.activityFestivalId.equalsIfValue(event.festivalId))
                    .and(tActivities.activityDeleted.isNull())
                .selectOneColumn(tActivities.activityTitle)
                .executeSelectOne();

            insertId = await db.insertInto(tShifts)
                .set({
                    eventId: event.id,
                    teamId: team.id,
                    shiftIdentifier: 'xx',
                    shiftCategoryId: row.categoryId,
                    shiftName: activityName,
                    shiftActivityId: row.activityId,
                    shiftExcitement: defaultExcitement,
                })
                .returningLastInsertedId()
                .executeInsert();
        } else {
            if (!row.name || !row.name.length)
                return { success: false, error: 'Please give the shift a name.' };
            if (!row.locationId || !!row.locationId)
                return { success: false, error: 'Please give the shift a location.' };

            insertId = await db.insertInto(tShifts)
                .set({
                    eventId: event.id,
                    teamId: team.id,
                    shiftIdentifier: 'xx',
                    shiftCategoryId: row.categoryId,
                    shiftName: row.name,
                    shiftExcitement: defaultExcitement,
                })
                .returningLastInsertedId()
                .executeInsert();
        }

        return {
            success: true,
            row: {
                id: insertId,
                colour: '',  // won't be used
                category: '',  // won't be used
                categoryOrder: 0,  // won't be used
                excitement: defaultExcitement,
            },
        };
    },

    async delete({ context, id }) {
        const { event, team } = await validateContext(context);
        if (!event || !team)
            notFound();

        return { success: false };
    },

    async list({ context, sort }) {
        const { event, team } = await validateContext(context);
        if (!event || !team || !event.festivalId)
            notFound();

        const shifts = await getShiftsForEvent(event.id, event.festivalId);
        const shiftsForTeam = shifts.filter(shift => shift.team.id === team.id);

        shiftsForTeam.sort((lhs, rhs) => {
            let mutation: number = 0;
            switch (sort?.field) {
                case 'category':
                    mutation = lhs.category.localeCompare(rhs.category);
                    break;
                case 'name':
                    mutation = lhs.name.localeCompare(rhs.name);
                    break;
                case 'hours':
                    mutation = lhs.scheduled.hours > rhs.scheduled.hours ? 1 : -1;
                    break;
            }

            return sort?.sort === 'asc' ? mutation : -mutation;
        });

        return {
            success: true,
            rowCount: shiftsForTeam.length,
            rows: shiftsForTeam.map(shift => ({
                id: shift.id,
                name: shift.name,
                colour: shift.colour,
                category: shift.category,
                categoryOrder: 0,
                hours: 0,
                activityId: shift.activity?.id,
                activityName: shift.activity?.name,
                excitement: shift.excitement,
            })),
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

        const shiftName = await db.selectFrom(tShifts)
            .where(tShifts.shiftId.equals(id))
            .selectOneColumn(tShifts.shiftName)
            .executeSelectNoneOrOne();

        await Log({
            type: LogType.AdminEventShiftMutation,
            severity: LogSeverity.Warning,
            sourceUser: props.user,
            data: {
                event: event.name,
                team: team.name,
                shift: shiftName,
                mutation,
            },
        });
    },
});
