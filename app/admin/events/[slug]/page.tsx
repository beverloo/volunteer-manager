// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { NextRouterParams } from '@lib/NextRouterParams';
import { EventDashboard } from './EventDashboard';
import { RegistrationStatus } from '@lib/database/Types';
import { generateEventMetadataFn } from './generateEventMetadataFn';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import db, { tEvents, tEventsTeams, tTeams, tUsersEvents } from '@lib/database';

export default async function EventPage(props: NextRouterParams<'slug'>) {
    const { event } = await verifyAccessAndFetchPageInfo(props.params);

    const usersEventsJoin = tUsersEvents.forUseInLeftJoin();

    const dbInstance = db;
    const teams = await dbInstance.selectFrom(tEvents)
        .innerJoin(tEventsTeams)
            .on(tEventsTeams.eventId.equals(tEvents.eventId))
            .and(tEventsTeams.enableTeam.equals(/* true= */ 1))
        .innerJoin(tTeams)
            .on(tTeams.teamId.equals(tEventsTeams.teamId))
        .leftJoin(usersEventsJoin)
            .on(usersEventsJoin.eventId.equals(tEvents.eventId))
            .and(usersEventsJoin.teamId.equals(tEventsTeams.teamId))
            .and(usersEventsJoin.registrationStatus.equals(RegistrationStatus.Accepted))
        .where(tEvents.eventId.equals(event.id))
        .select({
            teamName: tTeams.teamName,
            teamColourDarkTheme: tTeams.teamColourDarkTheme,
            teamColourLightTheme: tTeams.teamColourLightTheme,
            teamTargetSize: tEventsTeams.teamTargetSize,
            teamSize: dbInstance.count(usersEventsJoin.userId),

            enableContent: tEventsTeams.enableContent.equals(/* true= */ 1),
            enableRegistration: tEventsTeams.enableRegistration.equals(/* true= */ 1),
            enableSchedule: tEventsTeams.enableSchedule.equals(/* true= */ 1),
        })
        .groupBy(tEventsTeams.teamId)
        .orderBy(tTeams.teamName, 'asc')
        .executeSelectMany();

    return <EventDashboard event={event} teams={teams} />;
}

export const generateMetadata = generateEventMetadataFn();
