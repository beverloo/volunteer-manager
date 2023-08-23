// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import { Privilege, can } from '@app/lib/auth/Privileges';
import { VolunteerDataTable } from './VolunteerDataTable';
import { requireUser } from '@lib/auth/getUser';
import { sql } from '@lib/database';

/**
 * Overview page showing all users who volunteered at at least one of the AnimeCon events, displayed
 * in a <DataTable> component. Provides access to individual user pages.
 */
export default async function VolunteersPage() {
    const user = await requireUser();
    if (!can(user, Privilege.VolunteerAdministrator))
        notFound();

    const result = await sql`
        SELECT
            users.user_id AS id,
            CONCAT(users.first_name, " ", users.last_name) AS name,
            users.username AS email,
            GROUP_CONCAT(DISTINCT teams.team_name ORDER BY teams.team_name ASC) AS teams,
            users.activated AS isActivated,
            users.privileges & 1 = 1 AS isAdmin
        FROM
            users
        LEFT JOIN
            users_events ON (users_events.user_id = users.user_id AND
                             users_events.registration_status = "Accepted")
        LEFT JOIN
            teams ON teams.team_id = users_events.team_id
        GROUP BY
            users.user_id
        ORDER BY
            users.last_name ASC,
            users.first_name ASC`;

    if (!result.ok) {
        return <p>Cannot fetch data</p>
    }

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5">
                Volunteers
            </Typography>
            <Typography variant="body2" sx={{ pb: 2 }}>
                Overview of all everyone who signed up to volunteer at an AnimeCon event since 2010.
            </Typography>

            <VolunteerDataTable enableFilter data={structuredClone(result.rows) as any} />
        </Paper>
    );
}

export const metadata: Metadata = {
    title: 'Volunteers',
};

