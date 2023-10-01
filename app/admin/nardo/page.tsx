// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';

import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import { NardoDataTable } from './NardoDataTable';
import { Privilege } from '@lib/auth/Privileges';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

/**
 * This is the main landing page for the Del a Rie Advies service. It allows the volunteer to manage
 * the advice made available by our wonderful friends of Del a Rie Advies.
 */
export default async function DelARieAdviesPage() {
    await requireAuthenticationContext({
        check: 'admin',
        privilege: Privilege.SystemNardoAccess,
    });

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ pb: 1 }}>
                Del a Rie Advies
            </Typography>
            <Alert severity="info" sx={{ mb: 2}}>
                This is the exclusive repertoire demonstrating the best of what <strong>Del a Rie
                Advies</strong> has to offer. As all advice will be published immediately, please be
                concious of the diverse nature of our audience and keep it somewhat reasonable.
            </Alert>
            <NardoDataTable />
        </Paper>
    );
}

export const metadata: Metadata = {
    title: 'Del a Rie Advies',
};
