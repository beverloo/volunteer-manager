// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';
import { z } from 'zod';

import { type DataTableEndpoints, createDataTableApi } from '../../../createDataTableApi';
import { MutationSeverity, RegistrationStatus } from '@lib/database/Types';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import { getEventBySlug } from '@lib/EventLoader';
import db, { tActivities, tActivitiesAreas, tActivitiesLocations, tActivitiesLogs,
    tActivitiesTimeslots, tUsers, tUsersEvents, tTeams } from '@lib/database';

/**
 * Row model an entry program change history.
 */
const kProgramChangeRowModel = z.object({
    /**
     * Unique ID of this entry. Computed using a hash.
     */
    id: z.number(),

    /**
     * Severity of the change, i.e. how much attention should we pay to it?
     */
    severity: z.nativeEnum(MutationSeverity),

    /**
     * Date & time describing when the change happened, in UTC.
     */
    date: z.string(),

    /**
     * Textual, human readable description of the change.
     */
    change: z.string(),

    /**
     * References to individual entities to link the change. Only one is needed.
     */
    reference:
        z.object({ activityId: z.number() }).or(
            z.object({ areaId: z.number() }).or(
                z.object({ locationId: z.number() }))),

    /**
     * Optional information about the user who made this change, for internal changes.
     */
    user: z.object({
        /**
         * ID of the volunteer who made the change.
         */
        id: z.number(),

        /**
         * The volunteer's full name.
         */
        name: z.string(),

        /**
         * The team that this user will be volunteering in, if any.
         */
        team: z.string().optional(),

    }).optional(),
});

/**
 * The program change history API is dependent on a particular festival Id.
 */
const kProgramChangeContext = z.object({
    context: z.object({
        /**
         * Name of the event which is being consulted.
         */
        event: z.string(),

        /**
         * The festival Id for which history should be consulted.
         */
        festivalId: z.coerce.number(),
    }),
});

/**
 * Export type definitions so that the API can be used in `callApi()`.
 */
export type ProgramChangesEndpoints =
    DataTableEndpoints<typeof kProgramChangeRowModel, typeof kProgramChangeContext>;

/**
 * Export type definition for the API's Row Model.
 */
export type ProgramChangesRowModel = z.infer<typeof kProgramChangeRowModel>;

/**
 * Export type definition for the API's context.
 */
export type ProgramChangesContext = z.infer<typeof kProgramChangeContext>;

/**
 * The Program Changes History API is implemented as a regular DataTable API.
 * The following endpoints are provided by this implementation:

 *     GET /api/admin/content
 */
export const { GET } = createDataTableApi(kProgramChangeRowModel, kProgramChangeContext, {
    async accessCheck({ context }, action, props) {
        executeAccessCheck(props.authenticationContext, {
            check: 'admin-event',
            event: context.event,
        });
    },

    async list({ context, pagination, sort }) {
        const event = await getEventBySlug(context.event);
        if (!event)
            notFound();

        const activitiesJoin = tActivities.forUseInLeftJoin();
        const activitiesAreasJoin = tActivitiesAreas.forUseInLeftJoin();
        const activitiesLocationsJoin = tActivitiesLocations.forUseInLeftJoin();
        const activitiesTimeslotsJoin = tActivitiesTimeslots.forUseInLeftJoin();

        const usersJoin = tUsers.forUseInLeftJoin();
        const usersEventsJoin = tUsersEvents.forUseInLeftJoin();
        const teamsJoin = tTeams.forUseInLeftJoin();

        let sortingKey: 'date' | 'severity' | undefined;
        switch (sort?.field) {
            case 'severity':
            case 'date':
                sortingKey = sort.field;
                break;
        }

        const dbInstance = db;
        const activityLogs = await dbInstance.selectFrom(tActivitiesLogs)
            .leftJoin(activitiesJoin)
                .on(activitiesJoin.activityId.equals(tActivitiesLogs.activityId))
                .and(activitiesJoin.activityFestivalId.equals(tActivitiesLogs.festivalId))
            .leftJoin(activitiesAreasJoin)
                .on(activitiesAreasJoin.areaId.equals(tActivitiesLogs.areaId))
                .and(activitiesAreasJoin.areaFestivalId.equals(tActivitiesLogs.festivalId))
            .leftJoin(activitiesLocationsJoin)
                .on(activitiesLocationsJoin.locationId.equals(tActivitiesLogs.locationId))
                .and(activitiesLocationsJoin.locationFestivalId.equals(tActivitiesLogs.festivalId))
            .leftJoin(activitiesTimeslotsJoin)
                .on(activitiesTimeslotsJoin.timeslotId.equals(tActivitiesLogs.timeslotId))
            .leftJoin(usersJoin)
                .on(usersJoin.userId.equals(tActivitiesLogs.mutationUserId))
            .leftJoin(usersEventsJoin)
                .on(usersEventsJoin.userId.equals(tActivitiesLogs.mutationUserId))
                .and(usersEventsJoin.eventId.equals(event.eventId))
                .and(usersEventsJoin.registrationStatus.in([
                    RegistrationStatus.Accepted, RegistrationStatus.Cancelled ]))
            .leftJoin(teamsJoin)
                .on(teamsJoin.teamId.equals(usersEventsJoin.teamId))
            .where(tActivitiesLogs.festivalId.equals(context.festivalId))
            .select({
                id: tActivitiesLogs.mutationId,
                severity: tActivitiesLogs.mutationSeverity,
                date: tActivitiesLogs.mutationDateString,
                mutation: tActivitiesLogs.mutation,
                mutatedFields: tActivitiesLogs.mutationFields,

                // References:
                activityId: tActivitiesLogs.activityId,
                activityTitle: activitiesJoin.activityTitle,
                areaId: tActivitiesLogs.areaId,
                areaName: activitiesAreasJoin.areaDisplayName.valueWhenNull(
                    activitiesAreasJoin.areaName),
                locationId: tActivitiesLogs.locationId,
                locationName: activitiesLocationsJoin.locationDisplayName.valueWhenNull(
                    activitiesLocationsJoin.locationName),
                timeslotId: tActivitiesLogs.timeslotId,

                // User information:
                userId: tActivitiesLogs.mutationUserId,
                userName: usersJoin.firstName.concat(' ').concat(usersJoin.lastName),
                userTeam: teamsJoin.teamEnvironment,
            })
            .orderBy(sortingKey ?? 'date', sort?.sort ?? 'desc')
                .orderBy('areaId', 'asc nulls last')
                .orderBy('mutation', 'asc')
                .orderBy('id', 'asc')
            .limitIfValue(pagination ? pagination.pageSize : null)
                .offsetIfValue(pagination ? pagination.page * pagination.pageSize : null)
            .executeSelectPage();

        const changes: ProgramChangesRowModel[] = [];
        for (const entry of activityLogs.data) {
            let change: string = entry.mutation.replace('Created', 'Added');
            let reference: ProgramChangesRowModel['reference'];

            if (!!entry.activityTitle && !!entry.timeslotId) {
                change += ` a timeslot for "${entry.activityTitle}"`;
                reference = { activityId: entry.activityId! };
            } else if (!!entry.activityTitle) {
                change += ` The "${entry.activityTitle}" event`;
                reference = { activityId: entry.activityId! };
            } else if (!!entry.areaName) {
                change += ` the "${entry.areaName}" area`;
                reference = { areaId: entry.areaId! };
            } else if (!!entry.locationName) {
                change += ` the "${entry.locationName}" location`;
                reference = { locationId: entry.locationId! };
            } else {
                throw new Error(`Invalid log entry seen in the database: ${JSON.stringify(entry)}`);
            }

            if (!!entry.mutatedFields?.length)
                change += ` (${entry.mutatedFields})`;

            let user: ProgramChangesRowModel['user'];
            if (!!entry.userName) {
                user = {
                    id: entry.userId!,
                    name: entry.userName,
                    team: entry.userTeam,
                };
            }

            changes.push({
                id: entry.id,
                severity: entry.severity,
                date: entry.date,
                change,
                reference,
                user,
            });
        }

        return {
            success: true,
            rowCount: activityLogs.count,
            rows: changes,
        };
    },
});

export const dynamic = 'force-dynamic';
