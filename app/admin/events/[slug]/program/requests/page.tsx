// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { NextRouterParams } from '@lib/NextRouterParams';
import { RegistrationStatus } from '@lib/database/Types';
import { RequestDataTable } from './RequestDataTable';
import { Privilege, can, expand } from '@lib/auth/Privileges';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import db, { tEventsTeams, tRoles, tTeams, tUsersEvents, tUsers } from '@lib/database';

/**
 * The <ProgramRequestsPage> component lists the program entries where the organiser has requested
 * help from the volunteering teams. Requests must be managed directly by our team.
 */
export default async function ProgramRequestsPage(props: NextRouterParams<'slug'>) {
    const { event, user } = await verifyAccessAndFetchPageInfo(props.params);

    const unfilteredLeaders = await db.selectFrom(tUsersEvents)
        .innerJoin(tRoles)
            .on(tRoles.roleId.equals(tUsersEvents.roleId))
        .innerJoin(tUsers)
            .on(tUsers.userId.equals(tUsersEvents.userId))
        .where(tUsersEvents.eventId.equals(event.id))
            .and(tUsersEvents.registrationStatus.equals(RegistrationStatus.Accepted))
            .and(tRoles.roleAdminAccess.equals(/* true= */ 1))
        .select({
            username: tUsers.name,
            privileges: tUsers.privileges,
        })
        .orderBy(tUsers.firstName, 'asc')
            .orderBy(tUsers.lastName, 'asc')
        .executeSelectMany();

    const filteredLeaders = unfilteredLeaders.filter(({ privileges }) =>
        can(expand(privileges), Privilege.EventRequestOwnership));

    const leaders = filteredLeaders.map(({ username }) => username);
    const readOnly = !leaders.includes(`${user.firstName} ${user.lastName}`);

    const teams = await db.selectFrom(tEventsTeams)
        .innerJoin(tTeams)
            .on(tTeams.teamId.equals(tEventsTeams.teamId))
        .where(tEventsTeams.eventId.equals(event.id))
            .and(tEventsTeams.enableTeam.equals(/* true = */ 1))
        .select({
            id: tTeams.teamId,
            colour: tTeams.teamColourLightTheme,
            environment: tTeams.teamEnvironment,
            name: tTeams.teamTitle,
        })
        .orderBy(tTeams.teamName, 'asc')
        .executeSelectMany();

    return <RequestDataTable event={event.slug} leaders={leaders} readOnly={readOnly}
                             teams={teams} />;
}
