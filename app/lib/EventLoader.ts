// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { AccessControl } from './auth/AccessControl';
import type { EnvironmentDomain } from './Environment';
import type { User } from './auth/User';
import { Event } from './Event';
import { isAvailabilityWindowOpen } from './isAvailabilityWindowOpen';
import db, { tEvents, tEventsTeams, tTeams } from './database';

/**
 * Returns a single event identified by the given |slug|, or undefined when it does not exist.
 */
export async function getEventBySlug(slug: string): Promise<Event | undefined> {
    const eventsTeamsJoin = tEventsTeams.forUseInLeftJoin();
    const teamsJoin = tTeams.forUseInLeftJoin();

    const eventInfo = await db.selectFrom(tEvents)
        .leftJoin(eventsTeamsJoin)
            .on(eventsTeamsJoin.eventId.equals(tEvents.eventId))
        .leftJoin(teamsJoin)
            .on(teamsJoin.teamId.equals(eventsTeamsJoin.teamId))
        .where(tEvents.eventSlug.equals(slug))
        .select({
            eventId: tEvents.eventId,
            eventName: tEvents.eventName,
            eventShortName: tEvents.eventShortName,
            eventSlug: tEvents.eventSlug,
            eventFestivalId: tEvents.eventFestivalId,
            eventLocation: tEvents.eventLocation,
            eventTimezone: tEvents.eventTimezone,
            eventStartTime: tEvents.eventStartTime,
            eventEndTime: tEvents.eventEndTime,

            hotelEnabled: tEvents.hotelEnabled,
            refundEnabled: tEvents.refundEnabled,
            trainingEnabled: tEvents.trainingEnabled,

            environments: db.aggregateAsArray({
                environment: teamsJoin.teamEnvironment,

                enableApplications: {
                    start: eventsTeamsJoin.enableApplicationsStart,
                    end: eventsTeamsJoin.enableApplicationsEnd,
                },
                enableRegistration: {
                    start: eventsTeamsJoin.enableRegistrationStart,
                    end: eventsTeamsJoin.enableRegistrationEnd,
                },
                enableSchedule: {
                    start: eventsTeamsJoin.enableScheduleStart,
                    end: eventsTeamsJoin.enableScheduleEnd,
                },

                maximumVolunteers: eventsTeamsJoin.teamMaximumSize,
            }),
        })
        .groupBy(tEvents.eventId)
        .orderBy(tEvents.eventStartTime, 'desc')
        .executeSelectNoneOrOne();

    return eventInfo ? new Event(eventInfo)
                     : undefined;
}

/**
 * Returns the event name for the event uniquely identified by the given `eventId`, if any.
 */
export async function getEventNameForId(eventId: number): Promise<string | undefined> {
    return await db.selectFrom(tEvents)
        .where(tEvents.eventId.equals(eventId))
        .selectOneColumn(tEvents.eventShortName)
        .executeSelectNoneOrOne() ?? undefined;
}

/**
 * Returns the event slug for the event uniquely identified by the given `eventId`, if any.
 */
export async function getEventSlugForId(eventId: number): Promise<string | undefined> {
    return await db.selectFrom(tEvents)
        .where(tEvents.eventId.equals(eventId))
        .selectOneColumn(tEvents.eventSlug)
        .executeSelectNoneOrOne() ?? undefined;
}

/**
 * Returns all events that are publicly visible, limited to the |user| when they are signed in to
 * their account. This function issues a database query specific to the current environment.
 */
export async function getEventsForUser(
    environment: EnvironmentDomain, access: AccessControl, user?: User): Promise<Event[]>
{
    const eventsTeamsJoin = tEventsTeams.forUseInLeftJoin();
    const teamsJoin = tTeams.forUseInLeftJoin();

    const eventInfos = await db.selectFrom(tEvents)
        .leftJoin(eventsTeamsJoin)
            .on(eventsTeamsJoin.eventId.equals(tEvents.eventId))
            .and(eventsTeamsJoin.enableTeam.equals(/* true= */ 1))
        .leftJoin(teamsJoin)
            .on(teamsJoin.teamId.equals(eventsTeamsJoin.teamId))
        .where(tEvents.eventHidden.equals(0))
        .select({
            eventId: tEvents.eventId,
            eventName: tEvents.eventName,
            eventShortName: tEvents.eventShortName,
            eventSlug: tEvents.eventSlug,
            eventFestivalId: tEvents.eventFestivalId,
            eventTimezone: tEvents.eventTimezone,
            eventStartTime: tEvents.eventStartTime,
            eventEndTime: tEvents.eventEndTime,

            hotelEnabled: tEvents.hotelEnabled,
            refundEnabled: tEvents.refundEnabled,
            trainingEnabled: tEvents.trainingEnabled,

            environments: db.aggregateAsArray({
                environment: teamsJoin.teamEnvironment,
                slug: teamsJoin.teamSlug,

                enableApplications: {
                    start: eventsTeamsJoin.enableApplicationsStart,
                    end: eventsTeamsJoin.enableApplicationsEnd,
                },
                enableRegistration: {
                    start: eventsTeamsJoin.enableRegistrationStart,
                    end: eventsTeamsJoin.enableRegistrationEnd,
                },
                enableSchedule: {
                    start: eventsTeamsJoin.enableScheduleStart,
                    end: eventsTeamsJoin.enableScheduleEnd,
                },

                maximumVolunteers: eventsTeamsJoin.teamMaximumSize,
            }),
        })
        .groupBy(tEvents.eventId)
        .orderBy(tEvents.eventStartTime, 'desc')
        .executeSelectMany();

    if (!eventInfos.length)
        return [ /* no events */ ];

    const events: Event[] = [];
    for (const eventInfo of eventInfos) {
        let environmentAccessible = false;

        for (const eventEnvironmentInfo of eventInfo.environments) {
            if (eventEnvironmentInfo.environment !== environment)
                continue;

            environmentAccessible =
                isAvailabilityWindowOpen(eventEnvironmentInfo.enableRegistration) ||
                isAvailabilityWindowOpen(eventEnvironmentInfo.enableApplications) ||
                isAvailabilityWindowOpen(eventEnvironmentInfo.enableSchedule) ||
                access.can('event.schedule.access', { event: eventInfo.eventSlug }) ||
                access.can('event.visible', {
                    event: eventInfo.eventSlug,
                    team: eventEnvironmentInfo.slug,
                });
        }

        if (!environmentAccessible)
            continue;  // this |eventInfo| does not exist, or is not accessible to the user

        events.push(new Event(eventInfo));
    }

    return events;
}
