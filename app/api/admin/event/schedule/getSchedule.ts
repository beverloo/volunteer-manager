// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';
import { z } from 'zod';

import type { ActionProps } from '../../../Action';
import type { ApiDefinition, ApiRequest, ApiResponse } from '@app/api/Types';
import { RegistrationStatus } from '@lib/database/Types';
import { Temporal } from '@lib/Temporal';
import { determineAvailability } from './fn/determineAvailability';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import { getShiftsForEvent } from '@app/admin/lib/getShiftsForEvent';
import { getTimeslots } from './fn/getTimeslots';
import { readSettings } from '@lib/Settings';
import { validateContext } from '../validateContext';
import { validateTime } from './fn/validateTime';
import db, { tRoles, tSchedule, tUsers, tUsersEvents } from '@lib/database';

import { kTemporalPlainDate } from '@app/api/Types';

/**
 * Type that describes the contents of a schedule as it will be consumed by the client.
 */
export const kScheduleDefinition = z.object({
    /**
     * Minimum time that should be displayed on the timeline.
     */
    min: z.string(),

    /**
     * Maximum time that should be displayed on the timeline.
     */
    max: z.string(),

    /**
     * Markers that should be added to the schedule. These are used to indicate when individual
     * volunteers are not available, or when shifts should be avoided.
     */
    markers: z.array(z.object({
        /**
         * Unique ID of the marker.
         */
        id: z.string(),

        /**
         * Date and time at which the marker should start.
         */
        start: z.string(),

        /**
         * Date and time at which the marker should end.
         */
        end: z.string(),

        /**
         * Unique ID of the volunteer for whom this marker has been created.
         */
        resource: z.number(),

        /**
         * Type of marker that should be added to the schedule.
         */
        type: z.enum([ 'avoid', 'unavailable' ]),
    })),

    /**
     * Metadata specific to this event, but not per se to the schedule that's being displayed
     */
    metadata: z.object({
        /**
         * Recent shifts (included in `shifts`) that the signed in volunteer recently touched.
         */
        recent: z.array(z.number()),

        /**
         * Shifts that exist for the event, across teams.
         */
        shifts: z.array(z.object({
            /**
             * Unique ID of the shift as it exists in the database.
             */
            id: z.number(),

            /**
             * Label of the shift, as it should be presented.
             */
            label: z.string(),

            /**
             * Colour in which the shift should be displayed on the schedule.
             */
            color: z.string(),

            /**
             * Whether the shift is part of the local team, or of one of the partnering teams.
             */
            localTeam: z.boolean(),
        })),
    }),

    /**
     * The resources that should be shown on the schedule. Resources are volunteers, grouped by the
     * role that they have been assigned to, and then shown in alphabetical order.
     */
    resources: z.array(z.object({
        /**
         * Unique ID of the role that has been assigned to a volunteer.
         */
        id: z.string(),

        /**
         * Name of the role as it should be presented.
         */
        name: z.string(),

        /**
         * Volunteers who are part of this role, in alphabetical order.
         */
        children: z.array(z.object({
            /**
             * Unique ID that represents the volunteer as they exist in the database.
             */
            id: z.number(),

            /**
             * Name of the volunteer, as they should be referred to.
             */
            name: z.string(),

            /**
             * Whether this is the first time that the resource helps us out.
             */
            new: z.boolean(),
        })),

        /**
         * Whether the row should be collapsed by default.
         */
        collapsed: z.boolean(),
    })),

    /**
     * The shifts that have been scheduled on the timeline. Each must carry a moment at which they
     * start and end, a title and a colour.
     */
    shifts: z.array(z.object({
        /**
         * Unique ID of the scheduled shift as it exists in the database.
         */
        id: z.number(),

        /**
         * Unique ID of the defined shift as it exists in the database.
         */
        shiftId: z.number().optional(),

        /**
         * Date and time at which the shift starts.
         */
        start: z.string(),

        /**
         * Date and time at which the shift ends.
         */
        end: z.string(),

        /**
         * Title of the shift, as it should be presented.
         */
        title: z.string(),

        /**
         * Colour in which the shift should be displayed on the schedule.
         */
        color: z.string(),

        /**
         * Unique ID of the volunteer for whom this shift exists.
         */
        resource: z.number(),
    })),

    /**
     * Timezone in which the event will be taking place.
     */
    timezone: z.string(),
});

/**
 * Export the `kScheduleDefinition` type so that the client can depend on it directly.
 */
export type GetScheduleResult = z.infer<typeof kScheduleDefinition>;

/**
 * Interface definition for the Schedule API.
 */
export const kGetScheduleDefinition = z.object({
    request: z.object({
        /**
         * URL-safe slug of the event for which the schedule is being retrieved.
         */
        event: z.string(),

        /**
         * URL-safe slug of the team for which the schedule is being retrieved.
         */
        team: z.string(),

        /**
         * Optional date on which the schedule should focus, if any. Defaults to the entire event
         * when omitted.
         */
        date: kTemporalPlainDate.optional(),
    }),
    response: z.strictObject({
        /**
         * Whether the schedule could be retrieved successfully.
         */
        success: z.boolean(),

        /**
         * Error message in case the schedule could not be retrieved.
         */
        error: z.string().optional(),

        /**
         * The schedule that was retrieved, when successful.
         */
        schedule: kScheduleDefinition.optional(),
    }),
});

/**
 * Input that should be given in order to determine the date range.
 */
type DateRangeInput = {
    date?: Temporal.PlainDate,
    event: {
        startTime: Temporal.ZonedDateTime,
        endTime: Temporal.ZonedDateTime,
        timezone: string;
    },
    settings: {
        'schedule-day-view-start-time'?: string,
        'schedule-day-view-end-time'?: string,
        'schedule-event-view-start-hours'?: number,
        'schedule-event-view-end-hours'?: number,
    }
};

/**
 * Determines the date range for the schedule view. This is dependent on the dates during which the
 * event will be taking place, and whether the schedule for an individual day has been requested.
 */
function determineDateRange(input: DateRangeInput) {
    if (!!input.date) {
        const startOfDay = input.date.toZonedDateTime({
            timeZone: input.event.timezone,
            plainTime: '00:00:00',
        });

        const startTime = validateTime(input.settings['schedule-day-view-start-time'], '08:00');
        const endTime = validateTime(input.settings['schedule-day-view-end-time'], '27:30');

        const [ startHours, startMinutes ] = startTime.split(':').map(v => parseInt(v, 10));
        const [ endHours, endMinutes ] = endTime.split(':').map(v => parseInt(v, 10));

        return {
            min: startOfDay.add({ hours: startHours, minutes: startMinutes }),
            max: startOfDay.add({ hours: endHours, minutes: endMinutes }),
        };
    }

    const startHours = input.settings['schedule-event-view-start-hours'] ?? 4;
    const endHours = input.settings['schedule-event-view-end-hours'] ?? 2;

    return {
        min: input.event.startTime.subtract({ hours: startHours }),
        max: input.event.endTime.add({ hours: endHours }),
    };
}

/**
 * Adjusts the given `dateTime` for display purposes. The calendar component has an issue where the
 * calculations go a bit wonky, and taking off a minute for presentational purposes only helps.
 */
function adjustedStringForDisplay(dateTime: Temporal.ZonedDateTime): string {
    return dateTime.subtract({ minutes: 1 }).toString({ timeZoneName: 'never' });
}

export type GetScheduleDefinition = ApiDefinition<typeof kGetScheduleDefinition>;

type Request = ApiRequest<typeof kGetScheduleDefinition>;
type Response = ApiResponse<typeof kGetScheduleDefinition>;

/**
 * API that allows leaders to retrieve the schedule's current state. Optimised for being called at
 * a preconfigured interval, to avoid collisions between mutations.
 */
export async function getSchedule(request: Request, props: ActionProps): Promise<Response> {
    executeAccessCheck(props.authenticationContext, {
        check: 'admin-event',
        event: request.event,
    });

    const { event, team } = await validateContext(request);
    if (!event || !team || !props.user?.userId)
        notFound();

    const settings = await readSettings([
        'schedule-day-view-start-time',
        'schedule-day-view-end-time',
        'schedule-event-view-start-hours',
        'schedule-event-view-end-hours',
        'schedule-recent-shift-count',
    ]);

    const { min, max } = determineDateRange({ date: request.date, event, settings });

    const schedule: GetScheduleResult = {
        min: min.toString({ timeZoneName: 'never' }),
        max: max.toString({ timeZoneName: 'never' }),
        markers: [],
        metadata: {
            recent: [ /* empty */ ],
            shifts: [ /* empty */ ],
        },
        resources: [],
        shifts: [],
        timezone: event.timezone,
    };

    // ---------------------------------------------------------------------------------------------
    // Retrieve information about the volunteers.
    // ---------------------------------------------------------------------------------------------

    const users: number[] = [];
    const timeslots = await getTimeslots(event.festivalId);

    const usersEventsJoin = tUsersEvents.forUseInLeftJoinAs('oej');

    const dbInstance = db;
    const firstTimeVolunteers = new Set(await dbInstance.selectFrom(tUsersEvents)
        .leftJoin(usersEventsJoin)
            .on(usersEventsJoin.userId.equals(tUsersEvents.userId))
                .and(usersEventsJoin.eventId.notEquals(tUsersEvents.eventId))
                .and(usersEventsJoin.teamId.equals(tUsersEvents.teamId))
                .and(usersEventsJoin.registrationStatus.equals(RegistrationStatus.Accepted))
        .where(tUsersEvents.eventId.equals(event.id))
            .and(tUsersEvents.teamId.equals(team.id))
            .and(tUsersEvents.registrationStatus.equals(RegistrationStatus.Accepted))
            .and(usersEventsJoin.eventId.isNull())
        .selectOneColumn(tUsersEvents.userId)
        .executeSelectMany());

    const resources = await dbInstance.selectFrom(tUsersEvents)
        .innerJoin(tRoles)
            .on(tRoles.roleId.equals(tUsersEvents.roleId))
        .innerJoin(tUsers)
            .on(tUsers.userId.equals(tUsersEvents.userId))
        .where(tUsersEvents.eventId.equals(event.id))
            .and(tUsersEvents.teamId.equals(team.id))
            .and(tUsersEvents.registrationStatus.equals(RegistrationStatus.Accepted))
        .select({
            id: tRoles.roleId,
            name: tRoles.roleName,

            children: dbInstance.aggregateAsArray({
                id: tUsers.userId,
                name: tUsers.name,
                hours: tUsersEvents.preferenceHours,
                availabilityExceptions: tUsersEvents.availabilityExceptions,
                availabilityTimeslots: tUsersEvents.availabilityTimeslots,
                preferenceTimingStart: tUsersEvents.preferenceTimingStart,
                preferenceTimingEnd: tUsersEvents.preferenceTimingEnd,
            }),

            collapsed: tRoles.roleScheduleCollapse,
        })
        .groupBy(tRoles.roleId)
        .orderBy(tRoles.roleOrder, 'asc')
        .executeSelectMany();

    for (const roleResource of resources) {
        const roleId = `role/${roleResource.id}`;

        const children: GetScheduleResult['resources'][number]['children'] = [];
        for (const humanResource of roleResource.children) {
            const { avoid, unavailable } = determineAvailability({
                event, settings, timeslots, volunteer: humanResource });

            let volunteerMarkerId = 0;
            for (const { start, end } of avoid) {
                schedule.markers.push({
                    id: `${humanResource.id}/m/a/${++volunteerMarkerId}`,
                    start: adjustedStringForDisplay(start),
                    end: adjustedStringForDisplay(end),
                    resource: humanResource.id,
                    type: 'avoid',
                });
            }

            for (const { start, end } of unavailable) {
                schedule.markers.push({
                    id: `${humanResource.id}/m/u/${++volunteerMarkerId}`,
                    start: adjustedStringForDisplay(start),
                    end: adjustedStringForDisplay(end),
                    resource: humanResource.id,
                    type: 'unavailable',
                });
            }

            // TODO: Compute warnings

            children.push({
                id: humanResource.id,
                name: humanResource.name,
                ['new']: firstTimeVolunteers.has(humanResource.id),
            });

            users.push(humanResource.id);
        }

        children.sort((lhs, rhs) => lhs.name.localeCompare(rhs.name));

        schedule.resources.push({
            id: roleId,
            name: roleResource.name,
            children: children,
            collapsed: !!roleResource.collapsed,
        });
    }

    // ---------------------------------------------------------------------------------------------
    // Retrieve information about the assigned shifts.
    // ---------------------------------------------------------------------------------------------

    const shifts = await getShiftsForEvent(event.id, event.festivalId ?? 0);
    const shiftsMap = new Map(shifts.map(shift => [ shift.id, shift ]));

    const scheduledShifts = await dbInstance.selectFrom(tSchedule)
        .where(tSchedule.eventId.equals(event.id))
            .and(tSchedule.scheduleDeleted.isNull())
            .and(tSchedule.userId.in(users))
            .and(tSchedule.scheduleTimeEnd.greaterOrEquals(min))
            .and(tSchedule.scheduleTimeStart.lessOrEquals(max))
        .select({
            id: tSchedule.scheduleId,
            start: tSchedule.scheduleTimeStart,
            end: tSchedule.scheduleTimeEnd,
            resource: tSchedule.userId,
            shiftId: tSchedule.shiftId,
        })
        .executeSelectMany();

    for (const scheduledShift of scheduledShifts) {
        const shift =
            !!scheduledShift.shiftId ? shiftsMap.get(scheduledShift.shiftId)
                                     : { name: 'Unscheduled', colour: '#760707' };

        if (!shift)
            continue;  // the |scheduledShift| is not associated with a valid shift

        schedule.shifts.push({
            id: scheduledShift.id,
            shiftId: scheduledShift.shiftId,
            start: scheduledShift.start.toString({ timeZoneName: 'never' }),
            end: scheduledShift.end.toString({ timeZoneName: 'never' }),
            title: shift.name,
            color: shift.colour,
            resource: scheduledShift.resource,
        });

        // TODO: Compute warnings
    }

    // ---------------------------------------------------------------------------------------------
    // Include information about the `shifts` that exist for this festival
    // ---------------------------------------------------------------------------------------------

    const recentShifts = await dbInstance.selectDistinctFrom(tSchedule)
        .where(tSchedule.eventId.equals(event.id))
            .and(tSchedule.shiftId.isNotNull())
            .and(tSchedule.scheduleUpdatedBy.equals(props.user.userId))
        .selectOneColumn(tSchedule.shiftId)
        .orderBy(tSchedule.scheduleUpdated, 'desc')
        .limit(settings['schedule-recent-shift-count'] ?? 4)
        .executeSelectMany();

    for (const shiftId of recentShifts) {
        if (shiftsMap.has(shiftId!))
            schedule.metadata.recent.push(shiftId!);
    }

    for (const shift of shifts) {
        schedule.metadata.shifts.push({
            id: shift.id,
            label: shift.name,
            color: shift.colour,
            localTeam: shift.team.id === team.id,
        });
    }

    // ---------------------------------------------------------------------------------------------

    return {
        success: true,
        schedule
    };
}
