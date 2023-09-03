// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import type { NextRouterParams } from '@lib/NextRouterParams';
import { Header } from './Header';
import { Information } from './Information';
import { Logs } from './Logs';
import { type ParticipationInfo, Participation } from './Participation';
import { Privilege, can } from '@app/lib/auth/Privileges';
import { type LogMessage, fetchLogs } from '@app/lib/LogLoader';
import { VolunteerPrivileges } from './VolunteerPrivileges';
import { requireUser } from '@lib/auth/getUser';

import db, { tEvents, tRoles, tTeams, tUsers, tUsersEvents } from '@lib/database';

/**
 * Information about the volunteer for whom this page is being displayed.
 */
export interface VolunteerInfo {
    /**
     * Information about the volunteer's account.
     */
    account: {
        userId: number;
        username?: string;
        firstName: string;
        lastName: string;
        gender: string;
        birthdate?: Date;
        phoneNumber?: string;
        privileges: bigint;
        activated: number;
    };

    /**
     * Log messages about or issued by this user. Limited to 100 messages.
     */
    logs: LogMessage[];

    /**
     * Information about the volunteer's participation across AnimeCon events.
     */
    participation: ParticipationInfo[];
}

/**
 * Fetches information about the volunteer identified by the given `unverifiedId` from the database.
 */
async function fetchVolunteerInfo(unverifiedId: string): Promise<VolunteerInfo | undefined> {
    const numericUnverifiedId = parseInt(unverifiedId, 10);

    const account = await db.selectFrom(tUsers)
        .where(tUsers.userId.equals(numericUnverifiedId))
        .select({
            userId: tUsers.userId,
            username: tUsers.username,
            firstName: tUsers.firstName,
            lastName: tUsers.lastName,
            gender: tUsers.gender,
            birthdate: tUsers.birthdate,
            phoneNumber: tUsers.phoneNumber,
            privileges: tUsers.privileges,
            activated: tUsers.activated,
        })
        .executeSelectNoneOrOne();

    const logs = await fetchLogs({ sourceOrTargetUserId: numericUnverifiedId });

    const participation = await db.selectFrom(tUsersEvents)
        .innerJoin(tEvents)
            .on(tEvents.eventId.equals(tUsersEvents.eventId))
        .innerJoin(tTeams)
            .on(tTeams.teamId.equals(tUsersEvents.teamId))
        .innerJoin(tRoles)
            .on(tRoles.roleId.equals(tUsersEvents.roleId))
        .where(tUsersEvents.userId.equals(numericUnverifiedId))
        .select({
            id: tUsersEvents.eventId.multiply(1000).add(tUsersEvents.teamId),
            eventShortName: tEvents.eventShortName,
            eventSlug: tEvents.eventSlug,
            status: tUsersEvents.registrationStatus,
            role: tRoles.roleName,
            team: tTeams.teamName,
            teamSlug: tTeams.teamEnvironment,
            teamDarkThemeColour: tTeams.teamColourDarkTheme,
            teamLightThemeColour: tTeams.teamColourLightTheme,
        })
        .orderBy(tEvents.eventStartTime, 'desc')
        .executeSelectMany();

    if (!account || !participation)
        notFound();

    return {
        account,
        logs: logs.messages,
        participation,
    };
}

/**
 * Displays information about an individual volunteer, uniquely identified by their ID. Data will
 * be fetched from the database prior to being displayed.
 */
export default async function VolunteerPage(props: NextRouterParams<'id'>) {
    const user = await requireUser();
    if (!can(user, Privilege.VolunteerAdministrator))
        notFound();

    const volunteerInfo = await fetchVolunteerInfo(props.params.id);
    if (!volunteerInfo)
        notFound();

    const { account, logs, participation } = volunteerInfo;

    const isAdmin = can(user, Privilege.Administrator);

    return (
        <>
            <Header account={account} isAdmin={isAdmin} />
            <Information account={account} />

            { !!participation.length &&
                <Participation participation={participation} userId={account.userId} /> }

            { (can(user, Privilege.SystemLogsAccess) && logs.length > 0) &&
                <Logs messages={logs} /> }

            { can(user, Privilege.Administrator) &&
                <VolunteerPrivileges userId={account.userId} privileges={account.privileges} /> }
        </>
    );
}

/**
 * Dynamically generates metadata for this request by fetching the volunteer's real name from the
 * database, and using this as the page title. MysQL connections are pooled.
 */
export async function generateMetadata(props: NextRouterParams<'id'>): Promise<Metadata> {
    const user = await db.selectFrom(tUsers)
        .where(tUsers.userId.equals(parseInt(props.params.id, 10)))
        .select({ name: tUsers.firstName.concat(' ').concat(tUsers.lastName) })
        .executeSelectNoneOrOne();

    if (user)
        return { title: `${user.name} | AnimeCon Volunteer Manager` };

    return { /* no updates */ };
}
