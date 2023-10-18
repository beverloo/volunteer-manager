// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';

import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import { Privilege } from '@lib/auth/Privileges';
import { RegistrationStatus } from '@lib/database/Types';
import { VolunteerDataTable } from './VolunteerDataTable';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';
import db, { tTeams, tUsers, tUsersEvents } from '@lib/database';

/**
 * Overview page showing all users who volunteered at at least one of the AnimeCon events, displayed
 * in a Data Table. Provides access to individual user pages.
 */
export default async function VolunteersPage() {
    await requireAuthenticationContext({
        check: 'admin',
        privilege: Privilege.VolunteerAdministrator,
    });

    const teamsJoin = tTeams.forUseInLeftJoin();
    const usersEventsJoin = tUsersEvents.forUseInLeftJoin();

    const dbInstance = db;
    const volunteers = await dbInstance.selectFrom(tUsers)
        .leftJoin(usersEventsJoin)
            .on(usersEventsJoin.userId.equals(tUsers.userId)
                .and(usersEventsJoin.registrationStatus.equals(RegistrationStatus.Accepted)))
        .leftJoin(teamsJoin)
            .on(teamsJoin.teamId.equals(usersEventsJoin.teamId))
        .select({
            id: tUsers.userId,
            username: tUsers.username,
            name: tUsers.firstName.concat(' ').concat(tUsers.lastName),
            teams: dbInstance.stringConcatDistinct(teamsJoin.teamName),
            activated: tUsers.activated.equals(/* true= */ 1),
            admin: tUsers.privileges.modulo(2n).equals(/* true= */ 1n),
        })
        .groupBy(tUsers.userId)
        .orderBy(tUsers.lastName, 'asc')
        .orderBy(tUsers.firstName, 'asc')
        .executeSelectMany();

    const teamColours = await dbInstance.selectFrom(tTeams)
        .select({
            name: tTeams.teamName,
            darkThemeColour: tTeams.teamColourDarkTheme,
            lightThemeColour: tTeams.teamColourLightTheme,
        })
        .executeSelectMany();

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ pb: 1 }}>
                Volunteers
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
                This table lists all volunteers who helped us out since 2010. Not all e-mail
                addresses and phone numbers are known.
            </Alert>
            <VolunteerDataTable enableFilter teamColours={teamColours} volunteers={volunteers} />
        </Paper>
    );
}

export const metadata: Metadata = {
    title: 'Volunteers | AnimeCon Volunteer Manager',
};

