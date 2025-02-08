// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { NextPageParams } from '@lib/NextRouterParams';
import { RequestDataTable } from './RequestDataTable';
import { generateEventMetadataFn } from '../../generateEventMetadataFn';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import db, { tEventsTeams, tRoles, tTeams, tUsersEvents, tUsers } from '@lib/database';

import { kRegistrationStatus } from '@lib/database/Types';

/**
 * The <ProgramRequestsPage> component lists the program entries where the organiser has requested
 * help from the volunteering teams. Requests must be managed directly by our team.
 */
export default async function ProgramRequestsPage(props: NextPageParams<'event'>) {
    const { access, event } = await verifyAccessAndFetchPageInfo(props.params);

    const leaders = await db.selectFrom(tUsersEvents)
        .innerJoin(tRoles)
            .on(tRoles.roleId.equals(tUsersEvents.roleId))
        .innerJoin(tUsers)
            .on(tUsers.userId.equals(tUsersEvents.userId))
        .where(tUsersEvents.eventId.equals(event.id))
            .and(tUsersEvents.registrationStatus.equals(kRegistrationStatus.Accepted))
            .and(tRoles.roleAdminAccess.equals(/* true= */ 1))
        .selectOneColumn(tUsers.name)
        .orderBy(tUsers.firstName, 'asc')
            .orderBy(tUsers.lastName, 'asc')
        .executeSelectMany();

    const readOnly = !access.can('event.requests', { event: event.slug });

    const teams = await db.selectFrom(tEventsTeams)
        .innerJoin(tTeams)
            .on(tTeams.teamId.equals(tEventsTeams.teamId))
        .where(tEventsTeams.eventId.equals(event.id))
            .and(tEventsTeams.enableTeam.equals(/* true = */ 1))
        .select({
            id: tTeams.teamId,
            colour: tTeams.teamColourLightTheme,
            name: tTeams.teamTitle,
            slug: tTeams.teamSlug,
        })
        .orderBy(tTeams.teamName, 'asc')
        .executeSelectMany();

    return <RequestDataTable event={event.slug} leaders={leaders} readOnly={readOnly}
                             teams={teams} />;
}

export const generateMetadata = generateEventMetadataFn('Program requests');
