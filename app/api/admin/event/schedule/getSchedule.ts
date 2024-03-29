// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';
import { z } from 'zod';

import type { ActionProps } from '../../../Action';
import type { ApiDefinition, ApiRequest, ApiResponse } from '@app/api/Types';
import { RegistrationStatus } from '@lib/database/Types';
import { Temporal } from '@lib/Temporal';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import { validateContext } from '../validateContext';
import db, { tActivities, tActivitiesTimeslots, tRoles, tUsers, tUsersEvents } from '@lib/database';

import { kTemporalPlainDate, kTemporalZonedDateTime } from '@app/api/Types';
import { readSettings } from '@lib/Settings';

/**
 * Type describing an availability exception, as stored in the database.
 * @todo Use this definition in all other places.
 */
const kAvailabilityException = z.object({
    /**
     * Date and time on which the exception will start, in ISO 8601 format in UTC.
     */
    start: kTemporalZonedDateTime,

    /**
     * Date and time on which the exception will end, in ISO 8601 format in UTC.
     */
    end: kTemporalZonedDateTime,

    /**
     * State of this volunteer's availability during that period of time.
     */
    state: z.enum([ 'available', 'avoid', 'unavailable' ]),
});

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
        })),

        /**
         * Whether the row should be collapsed by default.
         */
        collapsed: z.boolean(),
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
 * Returns a time that is guaranteed to be valid. The `input` will be used when it confirms to the
 * "HH:MM" syntax, otherwise `defaultValue` will be returned.
 */
function validateTime(input: string | undefined, defaultValue: string): string {
    if (/^\d{1,2}:[0-5][0-9]$/.test(input || ''))
        return input!;

    return defaultValue;
}

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
 * Information contained within a particular availability entry.
 */
type AvailabilityEntry = {
    start: Temporal.ZonedDateTime;
    end: Temporal.ZonedDateTime;
};

/**
 * Adjusts the given `entry` based on the `available` times, during which the volunteer will always
 * be marked as available. This may result in the `entry` being dropped entirely, either its start
 * or end time being adjusted, or for the `entry` to be split in multiple entries.
 */
function adjustForAvailableTimeslots(entry: AvailabilityEntry, available: AvailabilityEntry[]) {
    // TODO: Implement this method.
    return [ entry ];
}

/**
 * Information that represents a particular volunteer's availability.
 */
type AvailabilityInfo = {
    avoid: AvailabilityEntry[];
    unavailable: AvailabilityEntry[];
};

/**
 * Information necessary to determine the markers for a given volunteer.
 */
type AvailabilityInput = {
    event: {
        startTime: Temporal.ZonedDateTime,
        endTime: Temporal.ZonedDateTime,
        timezone: string,
    },
    settings: {
        'schedule-day-view-start-time'?: string,
        'schedule-event-view-start-hours'?: number,
        'schedule-event-view-end-hours'?: number,
    },
    timeslots: Map<number, AvailabilityEntry>,
    volunteer: {
        availabilityExceptions?: string;
        availabilityTimeslots?: string;
        preferenceTimingStart?: number;
        preferenceTimingEnd?: number;
    }
};

/**
 * Determines the availability for the given `volunteer`. This can be used to create markers to
 * indicate their availability, and to calculate warnings when those are ignored.
 */
function determineAvailabilityForVolunteer(input: AvailabilityInput): AvailabilityInfo {
    const { event, settings, timeslots, volunteer } = input;

    const available: AvailabilityEntry[] = [];
    const availability: AvailabilityInfo = {
        avoid: [],
        unavailable: [],
    };

    // (1) Process availability exceptions. These take precedence over other blocks.
    if (!!volunteer.availabilityExceptions && volunteer.availabilityExceptions.length > 4) {
        try {
            const availabilityExceptionsString = JSON.parse(volunteer.availabilityExceptions);
            const availabilityExceptions =
                z.array(kAvailabilityException).parse(availabilityExceptionsString);

            for (const { start, end, state } of availabilityExceptions) {
                switch (state) {
                    case 'available':
                        available.push({ start, end });
                        break;

                    case 'avoid':
                    case 'unavailable':
                        availability[state].push({ start, end });
                        break;
                }
            }
        } catch (error: any) { console.warn(`Invalid availability exceptions seen: ${volunteer}`); }
    }

    // (2) Process timelines. These will be marked as "avoid" on the volunteer's schedule.
    if (!!volunteer.availabilityTimeslots && volunteer.availabilityTimeslots.length > 2) {
        try {
            const availabilityTimeslots =
                volunteer.availabilityTimeslots.split(',').map(v => parseInt(v, 10));

            for (const timeslotId of availabilityTimeslots) {
                const timeslot = timeslots.get(timeslotId);
                if (!timeslot)
                    continue;  // invalid timeslot

                const adjustedTimeslot = adjustForAvailableTimeslots(timeslot, available);
                if (!!adjustedTimeslot)
                    availability.avoid.push(...adjustedTimeslot);
            }
        } catch (error: any) { console.warn(`Invalid availability timeslots seen: ${volunteer}`); }
    }

    // (3) Process the volunteer's preferred start and end times for helping out.
    if (volunteer.preferenceTimingStart !== undefined &&
            volunteer.preferenceTimingEnd !== undefined) {
        // Determine the first and the last day:
        const firstDay =
            event.startTime.withTimeZone(event.timezone).with({ hour: 0, minute: 0, second: 0 });
        const lastDay =
            event.endTime.withTimeZone(event.timezone).with({ hour: 0, minute: 0, second: 0 });

        // Determine the hour on which the first festival day will start:
        const eventStartHour = event.startTime.withTimeZone(event.timezone).hour;
        const eventStartScheduleHour =
            eventStartHour - (settings['schedule-event-view-start-hours'] ?? 4);

        // Determine the hour on which a regular festival day will start:
        const dailyStartTime = validateTime(settings['schedule-day-view-start-time'], '08:00');
        const dailyStartHour = parseInt(dailyStartTime.split(':')[0], 10);

        let currentDay = firstDay;
        while (Temporal.ZonedDateTime.compare(currentDay, lastDay) <= 0) {
            let startHour: number;
            if (currentDay.epochSeconds === firstDay.epochSeconds)
                startHour = 0;  // midnight, event hasn't started yet
            else if (volunteer.preferenceTimingEnd > dailyStartHour)
                startHour = volunteer.preferenceTimingEnd - 24;
            else
                startHour = volunteer.preferenceTimingEnd;

            let endHour: number;
            if (currentDay.epochSeconds === firstDay.epochSeconds) {
                if (eventStartScheduleHour < volunteer.preferenceTimingStart)
                    endHour = volunteer.preferenceTimingStart;
                else
                    endHour = eventStartScheduleHour;
            } else {
                endHour = volunteer.preferenceTimingStart;
            }

            const timeslot: AvailabilityEntry = {
                start: currentDay.add({ hours: startHour }),
                end: currentDay.add({ hours: endHour }),
            };

            const adjustedTimeslot = adjustForAvailableTimeslots(timeslot, available);
            if (!!adjustedTimeslot)
                availability.unavailable.push(...adjustedTimeslot);

            currentDay = currentDay.add({ days: 1 });
        }

        // Add one more timeslot after the event has finished, until midnight, to complete the
        // timeline. This ensures that everything looks consistent.
        {
            const closingTimeslot: AvailabilityEntry = {
                end: lastDay.with({ hour: 23, minute: 59, second: 59 }),
                start: event.endTime.withTimeZone(event.timezone)
                    .add({ hours: settings['schedule-event-view-end-hours'] ?? 2 }),
            };

            const adjustedTimeslot = adjustForAvailableTimeslots(closingTimeslot, available);
            if (!!adjustedTimeslot)
                availability.unavailable.push(...adjustedTimeslot);
        }
    }

    return availability;
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
    if (!event || !team)
        notFound();

    const settings = await readSettings([
        'schedule-day-view-start-time',
        'schedule-day-view-end-time',
        'schedule-event-view-start-hours',
        'schedule-event-view-end-hours',
    ]);

    const { min, max } = determineDateRange({ date: request.date, event, settings });

    const schedule: GetScheduleResult = {
        min: min.toString({ timeZoneName: 'never' }),
        max: max.toString({ timeZoneName: 'never' }),
        markers: [],
        resources: [],
        timezone: event.timezone,
    };

    // ---------------------------------------------------------------------------------------------
    // Retrieve information about the volunteers.
    // ---------------------------------------------------------------------------------------------

    const dbInstance = db;
    const timeslotData = await dbInstance.selectFrom(tActivities)
        .innerJoin(tActivitiesTimeslots)
            .on(tActivitiesTimeslots.activityId.equals(tActivities.activityId))
        .where(tActivities.activityFestivalId.equals(event.festivalId!))
            .and(tActivities.activityDeleted.isNull())
            .and(tActivitiesTimeslots.timeslotDeleted.isNull())
        .select({
            id: tActivitiesTimeslots.timeslotId,
            start: tActivitiesTimeslots.timeslotStartTime,
            end: tActivitiesTimeslots.timeslotEndTime,
        })
        .executeSelectMany();

    const timeslots = new Map(timeslotData.map(
        timeslot => [ timeslot.id, { start: timeslot.start, end: timeslot.end } ]));

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
            const { avoid, unavailable } = determineAvailabilityForVolunteer({
                event, settings, timeslots, volunteer: humanResource });

            let volunteerMarkerId = 0;
            for (const { start, end } of avoid) {
                schedule.markers.push({
                    id: `avoid/${humanResource.id}/${++volunteerMarkerId}`,
                    start: start.toString({ timeZoneName: 'never' }),
                    end: end.toString({ timeZoneName: 'never' }),
                    resource: humanResource.id,
                    type: 'avoid',
                });
            }

            for (const { start, end } of unavailable) {
                schedule.markers.push({
                    id: `unavailable/${humanResource.id}/${++volunteerMarkerId}`,
                    start: start.toString({ timeZoneName: 'never' }),
                    end: end.toString({ timeZoneName: 'never' }),
                    resource: humanResource.id,
                    type: 'unavailable',
                });
            }

            // TODO: Compute arnings

            children.push({
                id: humanResource.id,
                name: humanResource.name,
            });
        }

        children.sort((lhs, rhs) => lhs.name.localeCompare(rhs.name));

        schedule.resources.push({
            id: roleId,
            name: roleResource.name,
            children: children,
            collapsed: !!roleResource.collapsed,
        });
    }

    return {
        success: true,
        schedule
    };
}
