// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { User } from './auth/User';
import { Event } from './Event';
import { Privilege, can } from './auth/Privileges';

import { RegistrationStatus } from './database/Types';
import db, { tEvents, tEventsTeams, tRoles, tTeams, tUsersEvents } from './database';

/**
 * Returns a single event identified by the given |slug|, or undefined when it does not exist.
 */
export async function getEventBySlug(slug: string)
    : Promise<Event | undefined>
{
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
            eventStartTime: tEvents.eventStartTime,
            eventEndTime: tEvents.eventEndTime,
            eventEnableRefunds: tEvents.publishRefunds,
            environments: db.aggregateAsArray({
                environment: teamsJoin.teamEnvironment,

                enableContent: eventsTeamsJoin.enableContent,
                enableRegistration: eventsTeamsJoin.enableRegistration,
                enableSchedule: eventsTeamsJoin.enableSchedule,
            }),
        })
        .groupBy(tEvents.eventId)
        .orderBy(tEvents.eventStartTime, 'desc')
        .executeSelectNoneOrOne();

    return eventInfo ? new Event(eventInfo)
                     : undefined;
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
export async function getEventsForUser(environmentName: string, user?: User): Promise<Event[]> {
    const eventsTeamsJoin = tEventsTeams.forUseInLeftJoin();
    const rolesJoin = tRoles.forUseInLeftJoin();
    const teamsJoin = tTeams.forUseInLeftJoin();
    const usersEventsJoin = tUsersEvents.forUseInLeftJoin();

    const eventInfos = await db.selectFrom(tEvents)
        .leftJoin(eventsTeamsJoin)
            .on(eventsTeamsJoin.eventId.equals(tEvents.eventId))
            .and(eventsTeamsJoin.enableTeam.equals(/* true= */ 1))
        .leftJoin(usersEventsJoin)
            .on(usersEventsJoin.eventId.equals(tEvents.eventId))
            .and(usersEventsJoin.userId.equals(user?.userId ?? -1))
            .and(usersEventsJoin.registrationStatus.equals(RegistrationStatus.Accepted))
        .leftJoin(rolesJoin)
            .on(rolesJoin.roleId.equals(usersEventsJoin.roleId))
        .leftJoin(teamsJoin)
            .on(teamsJoin.teamId.equals(eventsTeamsJoin.teamId))
        .where(tEvents.eventHidden.equals(0))
        .select({
            eventId: tEvents.eventId,
            eventName: tEvents.eventName,
            eventShortName: tEvents.eventShortName,
            eventSlug: tEvents.eventSlug,
            eventFestivalId: tEvents.eventFestivalId,
            eventStartTime: tEvents.eventStartTime,
            eventEndTime: tEvents.eventEndTime,
            environments: db.aggregateAsArray({
                environment: teamsJoin.teamEnvironment,

                enableContent: eventsTeamsJoin.enableContent,
                enableRegistration: eventsTeamsJoin.enableRegistration,
                enableSchedule: eventsTeamsJoin.enableSchedule,
            }),

            // Internal use:
            adminAccess: rolesJoin.roleAdminAccess,
        })
        .groupBy(tEvents.eventId)
        .orderBy(tEvents.eventStartTime, 'desc')
        .executeSelectMany();

    if (!eventInfos.length)
        return [ /* no events */ ];

    const eventAvailabilityOverride =
        can(user, Privilege.EventContentOverride) ||
        can(user, Privilege.EventRegistrationOverride) ||
        can(user, Privilege.EventScheduleOverride);

    const events: Event[] = [];
    for (const eventInfo of eventInfos) {
        let environmentAccessible = false;
        let environmentFound = false;

        for (const eventEnvironmentInfo of eventInfo.environments) {
            if (eventEnvironmentInfo.environment !== environmentName)
                continue;

            environmentFound = true;
            environmentAccessible =
                eventEnvironmentInfo.enableContent === 1 ||
                eventEnvironmentInfo.enableRegistration === 1 ||
                eventEnvironmentInfo.enableSchedule === 1;
        }

        if (!environmentFound)
            continue;  // this |eventInfo| does not exist for the given |environmentName|

        if (!environmentAccessible && !eventInfo.adminAccess && !eventAvailabilityOverride)
            continue;  // this |eventInfo| is not yet available to the |user|

        events.push(new Event(eventInfo));
    }

    return events;
}
