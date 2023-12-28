// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import type { ActionProps } from '../Action';
import { LogSeverity, LogType, Log } from '@lib/Log';
import { Privilege, can } from '@lib/auth/Privileges';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import { getEventBySlug } from '@lib/EventLoader';
import { getRegistration } from '@lib/RegistrationLoader';
import db, { tActivities, tActivitiesTimeslots, tEventsTeams, tHotelsPreferences, tTeams, tUsersEvents } from '@lib/database';

/**
 * Interface definition for the Availability API, exposed through
 * /api/event/availability-preferences.
 */
export const kAvailabilityPreferencesDefinition = z.object({
    request: z.object({
        /**
         * The environment for which the preferences are being submitted.
         */
        environment: z.string(),

        /**
         * Unique slug of the event in which the volunteer would like to participate.
         */
        event: z.string(),

        /**
         * Array of timeslot Ids that the volunteer would really like to attend. May be empty, and
         * should at most be the volunteer's personal preference limit.
         */
        eventPreferences: z.array(z.number()),

        /**
         * Property that allows administrators to push updates on behalf of other users.
         */
        adminOverrideUserId: z.number().optional(),
    }),
    response: z.strictObject({
        /**
         * Whether the availability preferences were stored successfully.
         */
        success: z.boolean(),

        /**
         * Error message when something went wrong. Will be presented to the user.
         */
        error: z.string().optional(),
    }),
});

export type AvailabilityPreferencesDefinition = z.infer<typeof kAvailabilityPreferencesDefinition>;

type Request = AvailabilityPreferencesDefinition['request'];
type Response = AvailabilityPreferencesDefinition['response'];

/**
 * API through which volunteers can update their availability preferences.
 */
export async function availabilityPreferences(request: Request, props: ActionProps)
    : Promise<Response>
{
    if (!props.user)
        return { success: false, error: 'You must be signed in to share your preferences' };

    let subjectUserId = props.user.userId;
    if (!!request.adminOverrideUserId) {
        executeAccessCheck(props.authenticationContext, {
            check: 'admin-event',
            event: request.event,
        });

        subjectUserId = request.adminOverrideUserId;
    }

    const event = await getEventBySlug(request.event);
    if (!event || !event.festivalId)
        return { success: false, error: 'The event does not support preferences…' };

    const registration = await getRegistration(request.environment, event, subjectUserId);
    if (!registration)
        return { success: false, error: 'Something seems to be wrong with your application…' };

    if (!registration.availabilityAvailable && !can(props.user, Privilege.EventAdministrator))
        return { success: false, error: 'Preferences cannot be shared yet, sorry!' };

    const eventsTeamsJoin = tEventsTeams.forUseInLeftJoin();

    const team = await db.selectFrom(tTeams)
        .leftJoin(eventsTeamsJoin)
            .on(eventsTeamsJoin.eventId.equals(event.eventId))
            .and(eventsTeamsJoin.teamId.equals(tTeams.teamId))
        .where(tTeams.teamEnvironment.equals(request.environment))
        .select({
            id: tTeams.teamId,
            enabled: eventsTeamsJoin.enableTeam,
        })
        .executeSelectNoneOrOne();

    if (!team || !team.enabled)
        return { success: false, error: 'This team does not participate in this event…' };

    let validatedTimeslots: number[] = [];
    if (request.eventPreferences.length > 0) {
        const eventPreferences =
            request.eventPreferences.length > registration.availabilityEventLimit
                ? request.eventPreferences.slice(0, registration.availabilityEventLimit - 1)
                : request.eventPreferences;

        validatedTimeslots = await db.selectFrom(tActivitiesTimeslots)
            .innerJoin(tActivities)
                .on(tActivities.activityId.equals(tActivitiesTimeslots.activityId))
            .where(tActivitiesTimeslots.timeslotId.in(eventPreferences))
                .and(tActivitiesTimeslots.timeslotDeleted.isNull())
                .and(tActivities.activityFestivalId.equals(event.festivalId))
                .and(tActivities.activityDeleted.isNull())
            .selectOneColumn(tActivitiesTimeslots.timeslotId)
            .executeSelectMany();
    }

    const affectedRows = await db.update(tUsersEvents)
        .set({
            availabilityTimeslots: validatedTimeslots.join(','),
        })
        .where(tUsersEvents.userId.equals(subjectUserId))
            .and(tUsersEvents.eventId.equals(event.eventId))
            .and(tUsersEvents.teamId.equals(team.id))
        .executeUpdate();

    if (!affectedRows)
        return { success: false, error: 'Unable to update your preferences in the database…' };

    if (!request.adminOverrideUserId) {
        await Log({
            type: LogType.ApplicationAvailabilityPreferences,
            severity: LogSeverity.Info,
            sourceUser: props.user,
            data: {
                event: event.shortName,
                timeslots: validatedTimeslots,
            },
        });
    } else {
        await Log({
            type: LogType.AdminUpdateAvailabilityPreferences,
            severity: LogSeverity.Warning,
            sourceUser: props.user,
            targetUser: request.adminOverrideUserId,
            data: {
                event: event.shortName,
                timeslots: validatedTimeslots,
            },
        });
    }

    return { success: true };
}
