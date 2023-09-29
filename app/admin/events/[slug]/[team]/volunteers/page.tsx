// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { NextRouterParams } from '@lib/NextRouterParams';
import { CancelledVolunteers } from './CancelledVolunteers';
import { RegistrationStatus } from '@lib/database/Types';
import { VolunteerTable } from './VolunteerTable';
import { generateEventMetadataFn } from '../../generateEventMetadataFn';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import db, { tRoles, tSchedule, tUsersEvents, tUsers } from '@lib/database';

/**
 * The volunteers page for a particular event lists the volunteers who have signed up and have been
 * accepted into the team. Each volunteer has a detailed page that will be linked to as well. Users
 * who have event administrator permission can "import" any volunteer into this event.
 */
export default async function VolunteersPage(props: NextRouterParams<'slug' | 'team'>) {
    const { event, team } = await verifyAccessAndFetchPageInfo(props.params);

    const dbInstance = db;
    const scheduleJoin = tSchedule.forUseInLeftJoin();

    const volunteers = await dbInstance.selectFrom(tUsersEvents)
        .innerJoin(tRoles)
            .on(tRoles.roleId.equals(tUsersEvents.roleId))
        .innerJoin(tUsers)
            .on(tUsers.userId.equals(tUsersEvents.userId))
        .leftJoin(scheduleJoin)
            .on(scheduleJoin.eventId.equals(event.id)
                .and(scheduleJoin.userId.equals(tUsersEvents.userId))
                .and(scheduleJoin.shiftId.isNotNull()))
        .groupBy(tUsersEvents.userId)
        .where(tUsersEvents.eventId.equals(event.id))
            .and(tUsersEvents.teamId.equals(team.id))
            .and(tUsersEvents.registrationStatus.in(
                [ RegistrationStatus.Accepted, RegistrationStatus.Cancelled ]))
        .select({
            id: tUsers.userId,
            status: tUsersEvents.registrationStatus,
            name: tUsers.firstName.concat(' ').concat(tUsers.lastName),
            role: tRoles.roleName,
            roleBadge: tRoles.roleBadge,
            shiftCount: dbInstance.count(scheduleJoin.scheduleId),
            shiftMilliseconds: dbInstance.sum(
                scheduleJoin.scheduleTimeEnd.getTime().substract(
                    scheduleJoin.scheduleTimeStart.getTime()))
        })
        .orderBy(tRoles.roleOrder, 'asc')
        .orderBy('name', 'asc')
        .executeSelectMany();

    const acceptedVolunteers: typeof volunteers = [];
    const cancelledVolunteers: typeof volunteers = [];

    for (const volunteer of volunteers) {
        if (volunteer.status === RegistrationStatus.Accepted)
            acceptedVolunteers.push(volunteer);
        else
            cancelledVolunteers.push(volunteer);
    }

    return (
        <>
            <VolunteerTable title={`${event.shortName} ${team.name}`}
                            volunteers={acceptedVolunteers} {...props} />
            { cancelledVolunteers.length > 0 &&
                <CancelledVolunteers volunteers={cancelledVolunteers} /> }
        </>
    );
}

export const generateMetadata = generateEventMetadataFn('Volunteers');
