// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type Metadata } from 'next';
import { notFound } from 'next/navigation';

import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import type { NextRouterParams } from '@lib/NextRouterParams';
import { sql } from '@lib/database';

/**
 * Displays information about an individual volunteer, uniquely identified by their ID. Data will
 * be fetched from the database prior to being displayed.
 */
export default async function VolunteerPage(props: NextRouterParams<'id'>) {
    const result = await sql`
        SELECT
            users.first_name AS firstName,
            users.last_name AS lastName
        FROM
            users
        WHERE
            users.user_id = ${props.params.id}`;

    if (!result.ok || !result.rows.length)
        notFound();

    const { firstName, lastName } = result.rows[0];

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5">
                {firstName} {lastName}
            </Typography>
        </Paper>
    );
}

export const metadata: Metadata = {
    title: 'Volunteer',
};
