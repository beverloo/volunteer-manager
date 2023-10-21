// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';
import Link from 'next/link';

import { default as MuiLink } from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import { ExportTable } from './ExportTable';
import { Privilege } from '@lib/auth/Privileges';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

/**
 * The <VolunteersExportsPage> component is the page that allows data to be exported. Every data
 * export is scoped to a particular event and data type, and has a strict expiration time and access
 * log to indicate who accessed the data, when.
 */
export default async function VolunteersExportsPage() {
    const { user } = await requireAuthenticationContext({
        check: 'admin',
        privilege: Privilege.VolunteerDataExports,
    });

    return (
        <>
            <Paper sx={{ p: 2 }}>
                <Typography variant="h5" sx={{ mb: 1 }}>
                    Exports
                </Typography>
                <Alert severity="warning" sx={{ mb: 2 }}>
                    This page allows you to export potentially sensitive data to share with the
                    broader organisation and our vendors. You, <strong>{user.firstName}</strong>,
                    are responsible for making sure that this happens in line with our{' '}
                    <MuiLink component={Link} href="/privacy">
                        GDPR & Data Sharing Policies
                    </MuiLink>.
                </Alert>
                <ExportTable />
            </Paper>
            { /* TODO: Create export */ }
        </>
    )
}

export const metadata: Metadata = {
    title: 'Exports | AnimeCon Volunteer Manager',
};
