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
import db, { tRoles, tUsers, tUsersEvents } from '@lib/database';

import { kTemporalPlainDate } from '@app/api/Types';
import { readSettings } from '@lib/Settings';

/**
 * Type that defines a marker that can be added as part of the schedule.
 */
const kScheduleMarkerDefinition = z.object({

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
             * When indicated, the number of hours this volunteer would like to help out with.
             */
            hours: z.number().optional(),

            /**
             * When applicable, times we should avoid scheduling shifts for this volunteer.
             */
            avoid: z.array(kScheduleMarkerDefinition).optional(),

            /**
             * When applicable, times during which the volunteer will not be available.
             */
            unavailable: z.array(kScheduleMarkerDefinition).optional(),
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
            min: startOfDay.add({ hours: startHours, minutes: startMinutes })
                .toString({ timeZoneName: 'never' }),
            max: startOfDay.add({ hours: endHours, minutes: endMinutes })
                .toString({ timeZoneName: 'never' }),
        };
    }

    const startHours = input.settings['schedule-event-view-start-hours'] ?? 4;
    const endHours = input.settings['schedule-event-view-end-hours'] ?? 2;

    return {
        min: input.event.startTime.subtract({ hours: startHours })
            .toString({ timeZoneName: 'never' }),
        max: input.event.endTime.add({ hours: endHours })
            .toString({ timeZoneName: 'never' }),
    };
}

/**
 * Information necessary to determine the markers for a given volunteer.
 */
type MarkerInput = {
    // TODO: availabilityExceptions
    // TODO: availabilityTimeslots
    // TODO: preferenceTimingStart
    // TODO: preferenceTimingEnd
};

/**
 * Determines the markers to apply for a particular volunteer. This speaks to their availability,
 * exceptions to their availability and their preferred working hours.
 */
function determineMarkersForVolunteer(volunteer: MarkerInput) {
    return {
        avoid: undefined,
        unavailable: undefined,
    }
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
        min, max,
        resources: [],
        timezone: event.timezone,
    };

    // ---------------------------------------------------------------------------------------------
    // Retrieve information about the volunteers.
    // ---------------------------------------------------------------------------------------------

    const dbInstance = db;
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
                // TODO: availabilityExceptions
                // TODO: availabilityTimeslots
                // TODO: preferenceTimingStart
                // TODO: preferenceTimingEnd
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
            const { avoid, unavailable } = determineMarkersForVolunteer(humanResource);

            children.push({
                id: humanResource.id,
                name: humanResource.name,
                hours: humanResource.hours,
                avoid, unavailable,
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
