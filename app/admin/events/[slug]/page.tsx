// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { NextRouterParams } from '@lib/NextRouterParams';
import { EventDashboard } from './EventDashboard';
import { RegistrationStatus } from '@lib/database/Types';
import { generateEventMetadataFn } from './generateEventMetadataFn';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import db, { tEvents, tEventsTeams, tRoles, tStorage, tTeams, tUsersEvents, tUsers }
    from '@lib/database';

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

    const storageJoin = tStorage.forUseInLeftJoin();

    const recentVolunteers = await dbInstance.selectFrom(tEvents)
        .innerJoin(tUsersEvents)
            .on(tUsersEvents.eventId.equals(tEvents.eventId))
            .and(tUsersEvents.registrationStatus.notIn([
                RegistrationStatus.Cancelled, RegistrationStatus.Rejected ]))
        .innerJoin(tTeams)
            .on(tTeams.teamId.equals(tUsersEvents.teamId))
        .innerJoin(tUsers)
            .on(tUsers.userId.equals(tUsersEvents.userId))
        .leftJoin(storageJoin)
            .on(storageJoin.fileId.equals(tUsers.avatarId))
        .where(tUsersEvents.eventId.equals(event.id))
        .select({
            userId: tUsers.userId,
            avatarHash: storageJoin.fileHash,
            teamEnvironment: tTeams.teamEnvironment,
            name: tUsers.firstName.concat(' ').concat(tUsers.lastName),
            status: tUsersEvents.registrationStatus,
        })
        .orderBy(tUsersEvents.registrationDate, 'desc')
        .orderBy(/* fallback for older events= */ tUsers.username, 'asc')
        .limit(/* based on width of the component= */ 5)
        .executeSelectMany();

    const rolesJoin = tRoles.forUseInLeftJoin();

    const seniors = await dbInstance.selectFrom(tEvents)
        .innerJoin(tUsersEvents)
            .on(tUsersEvents.eventId.equals(tEvents.eventId))
            .and(tUsersEvents.registrationStatus.equals(RegistrationStatus.Accepted))
        .innerJoin(tTeams)
            .on(tTeams.teamId.equals(tUsersEvents.teamId))
        .innerJoin(tUsers)
            .on(tUsers.userId.equals(tUsersEvents.userId))
        .leftJoin(storageJoin)
            .on(storageJoin.fileId.equals(tUsers.avatarId))
        .leftJoin(rolesJoin)
            .on(rolesJoin.roleId.equals(tUsersEvents.roleId))
        .where(tUsersEvents.eventId.equals(event.id))
            .and(rolesJoin.roleAdminAccess.equals(/* true= */ 1))
        .select({
            userId: tUsers.userId,
            avatarHash: storageJoin.fileHash,
            teamEnvironment: tTeams.teamEnvironment,
            name: tUsers.firstName.concat(' ').concat(tUsers.lastName),
            status: tUsersEvents.registrationStatus,
        })
        .orderBy(rolesJoin.roleOrder, 'asc')
        .orderBy(tUsers.username, 'asc')
        .executeSelectMany();

    return <EventDashboard event={event} recentVolunteers={recentVolunteers} seniors={seniors}
                           teams={teams} />;
}

export const generateMetadata = generateEventMetadataFn();
