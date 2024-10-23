// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import type { NextPageParams } from '@lib/NextRouterParams';
import { Header } from './Header';
import { Information } from './Information';
import { LogsDataTable } from '@app/admin/system/logs/LogsDataTable';
import { type ParticipationInfo, Participation } from './Participation';
import { VolunteerPermissions } from './VolunteerPermissions';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

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
        displayName?: string;
        gender: string;
        birthdate?: string;  // YYYY-MM-DD
        phoneNumber?: string;
        activated: number;
    };

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
    if (isNaN(numericUnverifiedId))
        return undefined;

    const dbInstance = db;
    const account = await dbInstance.selectFrom(tUsers)
        .where(tUsers.userId.equals(numericUnverifiedId))
        .select({
            userId: tUsers.userId,
            username: tUsers.username,
            firstName: tUsers.firstName,
            lastName: tUsers.lastName,
            displayName: tUsers.displayName,
            gender: tUsers.gender,
            birthdate: dbInstance.dateAsString(tUsers.birthdate),
            phoneNumber: tUsers.phoneNumber,
            activated: tUsers.activated,
        })
        .executeSelectNoneOrOne();

    const participation = await dbInstance.selectFrom(tUsersEvents)
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

    if (!account || !participation)
        notFound();

    return { account, participation };
}

/**
 * Displays information about an individual volunteer, uniquely identified by their ID. Data will
 * be fetched from the database prior to being displayed.
 */
export default async function VolunteerPage(props: NextPageParams<'id'>) {
    const { access } = await requireAuthenticationContext({
        check: 'admin',
        permission: {
            permission: 'volunteer.account.information',
            operation: 'read',
        },
    });

    const params = await props.params;

    const volunteerInfo = await fetchVolunteerInfo(params.id);
    if (!volunteerInfo)
        notFound();

    const { account, participation } = volunteerInfo;

    const canImpersonate = access.can('volunteer.account.impersonation');

    const permissionsReadOnly = !access.can('volunteer.account.permissions', 'update');

    return (
        <>
            <Header account={account} canImpersonate={canImpersonate} />
            <Information account={account} />

            { !!participation.length &&
                <Participation participation={participation} userId={account.userId} /> }

            { access.can('system.logs', 'read') &&
                <Paper sx={{ p: 2 }}>
                    <Typography variant="h5" sx={{ pb: 1 }}>
                        Logs
                    </Typography>
                    <LogsDataTable filters={{ sourceOrTargetUserId: account.userId }}
                                   pageSize={10} />
                </Paper> }

            { access.can('volunteer.account.permissions', 'read') &&
                <VolunteerPermissions readOnly={permissionsReadOnly} userId={account.userId} /> }

        </>
    );
}

/**
 * Dynamically generates metadata for this request by fetching the volunteer's real name from the
 * database, and using this as the page title. MysQL connections are pooled.
 */
export async function generateMetadata(props: NextPageParams<'id'>): Promise<Metadata> {
    const userId = parseInt((await props.params).id, 10);
    if (isNaN(userId))
        return { /* no updates */ };

    const user = await db.selectFrom(tUsers)
        .where(tUsers.userId.equals(userId))
        .select({ name: tUsers.name })
        .executeSelectNoneOrOne();

    if (user)
        return { title: `${user.name} | AnimeCon Volunteer Manager` };

    return { /* no updates */ };
}
