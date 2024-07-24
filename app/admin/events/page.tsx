// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';

import { default as TopLevelLayout } from '../TopLevelLayout';
import { EventCreate } from './EventCreate';
import { EventList } from './EventList';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';
import db, { tEvents, tEventsTeams, tTeams } from '@lib/database';

import { kAnyEvent, kAnyTeam } from '@lib/auth/AccessControl';

/**
 * The <EventsPage> component displays an overview of the available events within the portal, even
 * the ones that are not shortlisted, and enables event administrators to create entirely new
 * events. Events cannot be removed through the portal, although they can be hidden.
 */
export default async function EventsPage() {
    const { access, user } = await requireAuthenticationContext({
        check: 'admin',
        permission: {
            permission: 'event.visible',
            scope: {
                event: kAnyEvent,
                team: kAnyTeam,
            },
        },
    });

    const eventsTeamsJoin = tEventsTeams.forUseInLeftJoin();
    const teamsJoin = tTeams.forUseInLeftJoin();

    const dbInstance = db;
    const unfilteredEvents = await dbInstance.selectFrom(tEvents)
        .leftJoin(eventsTeamsJoin)
            .on(eventsTeamsJoin.eventId.equals(tEvents.eventId))
        .leftJoin(teamsJoin)
            .on(teamsJoin.teamId.equals(eventsTeamsJoin.teamId))
        .select({
            id: tEvents.eventId,
            hidden: tEvents.eventHidden.equals(/* true= */ 1),
            shortName: tEvents.eventShortName,
            slug: tEvents.eventSlug,
            startTime: dbInstance.dateTimeAsString(tEvents.eventStartTime),
            endTime: dbInstance.dateTimeAsString(tEvents.eventEndTime),
            teams: dbInstance.aggregateAsArray({
                name: teamsJoin.teamName,

                dark: teamsJoin.teamColourDarkTheme,
                light: teamsJoin.teamColourLightTheme,
            }),
        })
        .groupBy(tEvents.eventId)
        .orderBy(tEvents.eventStartTime, 'desc')
        .executeSelectMany();

    const filteredEvents = unfilteredEvents.filter(event => {
        return access.can('event.visible', {
            event: event.slug,
            team: kAnyTeam,
        });
    });

    return (
        <TopLevelLayout>
            <EventList events={filteredEvents} />
            { access.can('admin') && <EventCreate /> }
        </TopLevelLayout>
    );
}

export const metadata: Metadata = {
    title: 'Events | AnimeCon Volunteer Manager',
};
