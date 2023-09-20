// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { NextRouterParams } from '@lib/NextRouterParams';
import { Privilege, can  } from '@lib/auth/Privileges';
import { RegistrationStatus } from '@app/lib/database/Types';
import { generateEventMetadataFn } from '../../generateEventMetadataFn';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import db, { tEvents, tStorage, tUsers, tUsersEvents } from '@lib/database';

import { Applications } from './Applications';
import { CreateApplication } from './CreateApplication';
import { Header } from './Header';
import { Rejections } from './Rejections';

/**
 * The Applications page allows senior volunteers to see, and sometimes modify the incoming requests
 * for people who want to participate in this event. Event administrators can also directly create
 * new applications on this page themselves.
 */
export default async function EventApplicationsPage(props: NextRouterParams<'slug' | 'team'>) {
    const { event, team, user } = await verifyAccessAndFetchPageInfo(props.params);

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
                [ RegistrationStatus.Registered, RegistrationStatus.Rejected ]))
        .select({
            userId: tUsers.userId,
            age: dbInstance.fragmentWithType('int', 'required')
                .sql`TIMESTAMPDIFF(YEAR,
                    IFNULL(${tUsers.birthdate}, ${dbInstance.currentDate()}),
                    ${tEvents.eventStartTime})`,
            fullyAvailable: tUsersEvents.fullyAvailable.is(/* true= */ 1),
            date: tUsersEvents.registrationDate,
            firstName: tUsers.firstName,
            lastName: tUsers.lastName,
            avatar: storageJoin.fileHash,
            status: tUsersEvents.registrationStatus,
            preferences: tUsersEvents.preferences,
            preferenceHours: tUsersEvents.preferenceHours,
            preferenceTimingStart: tUsersEvents.preferenceTimingStart,
            preferenceTimingEnd: tUsersEvents.preferenceTimingEnd,
            history: dbInstance.count(usersEventsJoin.eventId),
        })
        .groupBy(tUsersEvents.userId)
        .orderBy(tUsers.firstName, 'asc')
        .orderBy(tUsers.lastName, 'asc')
        .executeSelectMany();

    const applications: typeof unfilteredApplications = [];
    const rejections: typeof unfilteredApplications = [];

    for (const application of unfilteredApplications) {
        if (application.status === RegistrationStatus.Registered)
            applications.push(application);
        else
            rejections.push(application);
    }

    const userData = user.toUserData();

    // Whether the volunteer can respond to applications without sending communication to the
    // affected volunteer. This is guarded behind a separate permission.
    const allowSilent = can(user, Privilege.VolunteerSilentMutations);

    // Whether the volunteer can respond to applications depends on their permissions. Those who
    // are either an event administrator or have application management rights can.
    const canManageApplications =
        can(user, Privilege.EventAdministrator) ||
        can(user, Privilege.EventApplicationManagement);

    return (
        <>
            <Header event={event} team={team} user={userData} />
            <Applications event={event} team={team} applications={applications}
                          canManageApplications={canManageApplications} allowSilent={allowSilent} />
            { !!rejections.length &&
                <Rejections applications={rejections} /> }
            { canManageApplications &&
                <CreateApplication event={event} team={team} user={userData} /> }
        </>
    );
}

export const generateMetadata = generateEventMetadataFn('Applications');
