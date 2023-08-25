// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import { Privilege, can } from '@lib/auth/Privileges';
import { RegistrationStatus } from '@lib/database/Types';
import { VolunteerDataTable } from './VolunteerDataTable';
import { requireUser } from '@lib/auth/getUser';
import db, { tTeams, tUsers, tUsersEvents } from '@lib/database';

/**
 * Overview page showing all users who volunteered at at least one of the AnimeCon events, displayed
 * in a <DataTable> component. Provides access to individual user pages.
 */
export default async function VolunteersPage() {
    const user = await requireUser();
    if (!can(user, Privilege.VolunteerAdministrator))
        notFound();

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
            id: tUsers.userId,  // `id` is required by <DataTable>
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
            <Typography variant="h5">
                Volunteers
            </Typography>
            <Typography variant="body2" sx={{ pb: 2 }}>
                Overview of all everyone who signed up to volunteer at an AnimeCon event since 2010.
            </Typography>
            <VolunteerDataTable enableFilter teamColours={teamColours} volunteers={volunteers} />
        </Paper>
    );
}

export const metadata: Metadata = {
    title: 'Volunteers',
};

