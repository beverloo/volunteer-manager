// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Collapse from '@mui/material/Collapse';

import type { NextPageParams } from '@lib/NextRouterParams';
import { Applications } from './Applications';
import { CreateApplication } from './CreateApplication';
import { Header } from './Header';
import { RejectedApplications } from './RejectedApplications';
import { generateEventMetadataFn } from '../../generateEventMetadataFn';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import db, { tEvents, tStorage, tUsers, tUsersEvents } from '@lib/database';

import { kRegistrationStatus } from '@lib/database/Types';

/**
 * The Applications page allows senior volunteers to see, and sometimes modify the incoming requests
 * for people who want to participate in this event. Event administrators can also directly create
 * new applications on this page themselves.
 */
export default async function EventApplicationsPage(props: NextPageParams<'event' | 'team'>) {
    const params = await props.params;
    const accessScope = {
        event: params.event,
        team: params.team,
    };

    const { access, event, team, user } = await verifyAccessAndFetchPageInfo(props.params, {
        permission: 'event.applications',
        operation: 'read',
        scope: accessScope,
    });

    const dbInstance = db;

    const storageJoin = tStorage.forUseInLeftJoin();
    const usersEventsJoin = tUsersEvents.forUseInLeftJoinAs('previous_events');

    const unfilteredApplications = await dbInstance.selectFrom(tUsersEvents)
        .innerJoin(tEvents)
            .on(tEvents.eventId.equals(tUsersEvents.eventId))
        .innerJoin(tUsers)
            .on(tUsers.userId.equals(tUsersEvents.userId))
        .leftJoin(storageJoin)
            .on(storageJoin.fileId.equals(tUsers.avatarId))
        .leftJoin(usersEventsJoin)
            .on(usersEventsJoin.userId.equals(tUsersEvents.userId))
            .and(usersEventsJoin.eventId.notEquals(tUsersEvents.eventId))
        .where(tUsersEvents.eventId.equals(event.id))
            .and(tUsersEvents.teamId.equals(team.id))
            .and(tUsersEvents.registrationStatus.in(
                [ kRegistrationStatus.Registered, kRegistrationStatus.Rejected ]))
        .select({
            userId: tUsers.userId,
            age: dbInstance.fragmentWithType('int', 'required')
                .sql`TIMESTAMPDIFF(YEAR,
                    IFNULL(${tUsers.birthdate}, ${dbInstance.currentDate()}),
                    ${tEvents.eventStartTime})`,
            fullyAvailable: tUsersEvents.fullyAvailable.is(/* true= */ 1),
            date: dbInstance.dateTimeAsString(tUsersEvents.registrationDate),
            firstName: tUsers.firstName,
            lastName: tUsers.lastName,
            avatar: storageJoin.fileHash,
            status: tUsersEvents.registrationStatus,
            preferences: tUsersEvents.preferences,
            preferenceHours: tUsersEvents.preferenceHours,
            preferenceTimingStart: tUsersEvents.preferenceTimingStart,
            preferenceTimingEnd: tUsersEvents.preferenceTimingEnd,
            history: dbInstance.count(usersEventsJoin.eventId),
            suspended: tUsers.participationSuspended,
        })
        .groupBy(tUsersEvents.userId)
        .orderBy(tUsers.firstName, 'asc')
        .orderBy(tUsers.lastName, 'asc')
        .executeSelectMany();

    const applications: typeof unfilteredApplications = [];
    const rejections: typeof unfilteredApplications = [];

    for (const application of unfilteredApplications) {
        if (application.status === kRegistrationStatus.Registered)
            applications.push(application);
        else
            rejections.push(application);
    }

    // Whether the volunteer can respond to applications without sending communication to the
    // affected volunteer. This is guarded behind a separate permission.
    const allowSilent = access.can('volunteer.silent');

    const canAccessAccounts = access.can('volunteer.account.information', 'read');

    // Whether the volunteer can respond to applications depends on their permissions.
    const canCreateApplications = access.can('event.applications', 'create', accessScope);
    const canUpdateApplications = access.can('event.applications', 'update', accessScope);

    return (
        <>
            <Header event={event} team={team} user={user} />
            <Applications event={event.slug} team={team.slug} applications={applications}
                          canAccessAccounts={canAccessAccounts}
                          canManageApplications={canUpdateApplications} allowSilent={allowSilent} />
            { canCreateApplications &&
                <CreateApplication event={event} team={team} user={user} /> }
            <Collapse in={!!rejections.length}>
                <RejectedApplications applications={rejections} event={event.slug}
                                      team={team.slug} editable={canCreateApplications} />
            </Collapse>
        </>
    );
}

export const generateMetadata = generateEventMetadataFn('Applications');
