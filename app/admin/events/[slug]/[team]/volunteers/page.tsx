// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import { NextRouterParams } from '@lib/NextRouterParams';
import { RegistrationStatus } from '@app/lib/database/Types';
import { VolunteerImport } from './VolunteerImport';
import { VolunteerTable } from './VolunteerTable';
import { generateEventMetadataFn } from '../../generateEventMetadataFn';
import db, { tEvents, tRoles, tSchedule, tUsersEvents, tUsers, tTeams } from '@lib/database';

/**
 * The volunteers page for a particular event lists the volunteers who have signed up and have been
 * accepted into the team. Each volunteer has a detailed page that will be linked to as well. Users
 * who have event administrator permission can "import" any volunteer into this event.
 */
export default async function VolunteersPage(props: NextRouterParams<'slug' | 'team'>) {
    const { params } = props;

    // TODO: Access check

    const [ event, team ] = await Promise.all([
        // -----------------------------------------------------------------------------------------
        // Event information
        // -----------------------------------------------------------------------------------------
        db.selectFrom(tEvents)
            .where(tEvents.eventSlug.equals(params.slug))
            .select({
                eventId: tEvents.eventId,
                eventShortName: tEvents.eventShortName,
            })
            .executeSelectNoneOrOne(),

        // -----------------------------------------------------------------------------------------
        // Team information
        // -----------------------------------------------------------------------------------------
        db.selectFrom(tTeams)
            .where(tTeams.teamEnvironment.equals(params.team))
            .select({
                teamId: tTeams.teamId,
                teamName: tTeams.teamName,
            })
            .executeSelectNoneOrOne(),
    ]);

    if (!event || !team)
        notFound();

    const dbInstance = db;
    const scheduleJoin = tSchedule.forUseInLeftJoin();

    const volunteers = await dbInstance.selectFrom(tUsersEvents)
        .innerJoin(tRoles)
            .on(tRoles.roleId.equals(tUsersEvents.roleId))
        .innerJoin(tUsers)
            .on(tUsers.userId.equals(tUsersEvents.userId))
        .leftJoin(scheduleJoin)
            .on(scheduleJoin.eventId.equals(event.eventId)
                .and(scheduleJoin.userId.equals(tUsersEvents.userId))
                .and(scheduleJoin.shiftId.isNotNull()))
        .groupBy(tUsersEvents.userId)
        .where(tUsersEvents.eventId.equals(event.eventId))
            .and(tUsersEvents.teamId.equals(team.teamId))
            .and(tUsersEvents.registrationStatus.in(
                [ RegistrationStatus.Accepted, RegistrationStatus.Cancelled ]))
        .select({
            id: tUsers.userId,
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

    return (
        <>
            <VolunteerTable title={`${event.eventShortName} ${team.teamName}`}
                            volunteers={volunteers} {...props} />

            <VolunteerImport />
        </>
    );
}

export const generateMetadata = generateEventMetadataFn('Volunteers');
