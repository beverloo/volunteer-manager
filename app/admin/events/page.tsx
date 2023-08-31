// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';

import { default as TopLevelLayout } from '../TopLevelLayout';
import { EventCreate } from './EventCreate';
import { EventList } from './EventList';
import { Privilege, can } from '@lib/auth/Privileges';
import { requireUser } from '@lib/auth/getUser';
import db, { tEvents, tEventsTeams, tRoles, tTeams, tUsersEvents } from '@lib/database';

/**
 * The <EventsPage> component displays an overview of the available events within the portal, even
 * the ones that are not shortlisted, and enables event administrators to create entirely new
 * events. Events cannot be removed through the portal, although they can be hidden.
 */
export default async function EventsPage() {
    const user = await requireUser();

    const eventsTeamsJoin = tEventsTeams.forUseInLeftJoin();
    const usersEventsJoin = tUsersEvents.forUseInLeftJoin();
    const rolesJoin = tRoles.forUseInLeftJoin();
    const teamsJoin = tTeams.forUseInLeftJoin();

    const dbInstance = db;
    const unfilteredEvents = await dbInstance.selectFrom(tEvents)
        .leftJoin(usersEventsJoin)
            .on(usersEventsJoin.eventId.equals(tEvents.eventId))
            .and(usersEventsJoin.userId.equals(user.userId))
        .leftJoin(rolesJoin)
            .on(rolesJoin.roleId.equals(usersEventsJoin.roleId))
        .leftJoin(eventsTeamsJoin)
            .on(eventsTeamsJoin.eventId.equals(tEvents.eventId))
        .leftJoin(teamsJoin)
            .on(teamsJoin.teamId.equals(eventsTeamsJoin.teamId))
        .select({
            id: tEvents.eventId,
            hidden: tEvents.eventHidden.equals(/* true= */ 1),
            shortName: tEvents.eventShortName,
            slug: tEvents.eventSlug,
            startTime: tEvents.eventStartTime,
            endTime: tEvents.eventEndTime,
            teams: dbInstance.aggregateAsArray({
                name: teamsJoin.teamName,

                dark: teamsJoin.teamColourDarkTheme,
                light: teamsJoin.teamColourLightTheme,
            }),

            // For internal use:
            userAdminAccess: rolesJoin.roleAdminAccess,
            userRegistrationStatus: usersEventsJoin.registrationStatus,
        })
        .groupBy(tEvents.eventId)
        .orderBy(tEvents.eventStartTime, 'desc')
        .executeSelectMany();

    const eventAdministrator = can(user, Privilege.EventAdministrator);
    const filteredEvents = unfilteredEvents.filter(event => {
        return eventAdministrator || !event.hidden;
    });

    return (
        <TopLevelLayout>
            <EventList events={filteredEvents} />
            { eventAdministrator && <EventCreate /> }
        </TopLevelLayout>
    );
}

export const metadata: Metadata = {
    title: 'Events | AnimeCon Volunteer Manager',
};
