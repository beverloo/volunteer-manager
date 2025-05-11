// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import type { NextPageParams } from '@lib/NextRouterParams';
import { ParticipationTable } from './ParticipationTable';
import db, { tEvents, tRoles, tTeams, tUsersEvents } from '@lib/database';

/**
 * The <AccountParticipationPage> component displays the events that this volunteer has participated
 * in, together with any notes that may have been recorded surrounding their participation.
 */
export default async function AccountParticipationPage(props: NextPageParams<'id'>) {
    const userId = parseInt((await props.params).id, /* radix= */ 10);
    if (!Number.isSafeInteger(userId))
        notFound();

    const dbInstance = db;
    const participation = await dbInstance.selectFrom(tUsersEvents)
        .innerJoin(tEvents)
            .on(tEvents.eventId.equals(tUsersEvents.eventId))
        .innerJoin(tTeams)
            .on(tTeams.teamId.equals(tUsersEvents.teamId))
        .innerJoin(tRoles)
            .on(tRoles.roleId.equals(tUsersEvents.roleId))
        .where(tUsersEvents.userId.equals(userId))
        .select({
            id: tUsersEvents.eventId.multiply(1000).add(tUsersEvents.teamId),
            eventShortName: tEvents.eventShortName,
            eventSlug: tEvents.eventSlug,
            eventStartTime: dbInstance.dateTimeAsString(tEvents.eventStartTime),
            status: tUsersEvents.registrationStatus,
            role: tRoles.roleName,
            team: tTeams.teamName,
            teamSlug: tTeams.teamSlug,
            teamDarkThemeColour: tTeams.teamColourDarkTheme,
            teamLightThemeColour: tTeams.teamColourLightTheme,
        })
        .orderBy('eventStartTime', 'desc')
        .executeSelectMany();

    return <ParticipationTable participation={participation} userId={userId} />;
}
