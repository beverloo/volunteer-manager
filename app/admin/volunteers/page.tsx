// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type Metadata } from 'next';

import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import { type DataTableColumn, DataTable } from '../DataTable';
import { sql } from '@lib/database';

export default async function VolunteersPage() {
    const columns: DataTableColumn[] = [
        {
            field: 'id',
            headerName: /* empty= */ '',
            sortable: false,
            width: 50,

            clientTransform: {
                type: 'button',
                icon: 'read-more',
            },
        },
        {
            field: 'firstName',
            headerName: 'First name',
            sortable: true,
            flex: 1,
        },
        {
            field: 'lastName',
            headerName: 'Last name',
            flex: 1,
        },
        {
            field: 'email',
            headerName: 'E-mail',
            sortable: true,
            flex: 2,
        },
        {
            field: 'events',
            headerName: 'Events',
            type: 'number',
            sortable: true,
        },
        {
            field: 'teams',
            headerName: 'Teams',
            sortable: false,
            flex: 2,

            clientTransform: {
                type: 'teams',
            }
        }
    ];

    const result = await sql`
        SELECT
            users.user_id AS id,
            users.first_name AS firstName,
            users.last_name AS lastName,
            users.username AS email,
            users.activated AS activated,
            COUNT(users_events.event_id) AS events,
            GROUP_CONCAT(DISTINCT teams.team_name ORDER BY teams.team_name ASC) AS teams
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

    const rows = [];
    for (const row of result.rows) {
        rows.push({
            ...row,
            id: `/admin/volunteers/${row.id}`,
        })
    }

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ pb: 2 }}>
                Volunteers
            </Typography>
            <DataTable enableFilter rows={rows} columns={columns} />
        </Paper>
    );
}

export const metadata: Metadata = {
    title: 'Volunteers',
};

