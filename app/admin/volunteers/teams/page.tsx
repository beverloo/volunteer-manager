// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';

import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import { Roles } from './Roles';
import { Team } from './Team';
import db, { tRoles, tTeams } from '@lib/database';

/**
 * This page allows a volunteer administrator to manage settings of the volunteering teams that have
 * been created. These settings have a high impact on the functionality of the portal, so operations
 * should be fairly rare. Creating and removing teams is restricted to the database.
 */
export default async function VolunteersTeamsPage() {
    const roles = await db.selectFrom(tRoles)
        .select({
            id: tRoles.roleId,
            roleName: tRoles.roleName,
            roleBadge: tRoles.roleBadge,
            roleOrder: tRoles.roleOrder,
            adminAccess: tRoles.roleAdminAccess.equals(/* true= */ 1),
            hotelEligible: tRoles.roleHotelEligible.equals(/* true= */ 1),
            trainingEligible: tRoles.roleTrainingEligible.equals(/* true= */ 1),
        })
        .orderBy(tRoles.roleOrder, 'asc')
        .orderBy(tRoles.roleName, 'asc')
        .executeSelectMany();

    const teams = await db.selectFrom(tTeams)
        .select({
            id: tTeams.teamId,
            teamName: tTeams.teamName,
            teamDescription: tTeams.teamDescription,
            teamEnvironment: tTeams.teamEnvironment,
        })
        .orderBy(tTeams.teamName, 'asc')
        .executeSelectMany();

    return (
        <>
            <Paper sx={{ p: 2 }}>
                <Typography variant="h5" sx={{ mb: 1 }}>
                    Teams & roles
                </Typography>
                <Alert severity="warning">
                    This page allows you to modify the settings for existing teams. Creating and
                    removing teams is possible too, but restricted to the database as this is a very
                    infrequent operation and carries a high risk of breaking the Volunteer Manager.
                </Alert>
            </Paper>
            <Roles roles={roles} />
            { teams.map(team => <Team key={team.id} roles={roles} team={team} />) }
        </>
    );
}

export const metadata: Metadata = {
    title: 'Teams & roles',
};

