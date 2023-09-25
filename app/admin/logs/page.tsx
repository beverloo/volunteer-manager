// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import { LogsDataTable } from './LogsDataTable';
import { Privilege, can } from '@lib/auth/Privileges';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

/**
 * The logs page provides access to the most recent log entries created by the Volunteer Manager,
 * with a variety of filtering options available. All log entries are made accessible to the client,
 * however they will be streamed by the server to deal with ~infinitely large data sets.
 */
export default async function LogsPage() {
    const { user } = await requireAuthenticationContext();
    if (!can(user, Privilege.SystemLogsAccess))
        notFound();

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ pb: 2 }}>
                Logs
            </Typography>
            <LogsDataTable />
        </Paper>
    );
}

export const metadata: Metadata = {
    title: 'Logs | AnimeCon Volunteer Manager',
};
