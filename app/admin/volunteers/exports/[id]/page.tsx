// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';

import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import type { NextRouterParams } from '@lib/NextRouterParams';
import { Privilege } from '@lib/auth/Privileges';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

/**
 * The <VolunteersExportDetailsPage> component is the page that displays detailed information about
 * a particular data export. This includes both metadata and access logs.
 */
export default async function VolunteersExportDetailsPage(props: NextRouterParams<'id'>) {
    await requireAuthenticationContext({
        check: 'admin',
        privilege: Privilege.VolunteerAdministrator,
    });

    return (
        <>
            <Paper sx={{ p: 2 }}>
                <Typography variant="h5" sx={{ mb: 1 }}>
                    Exports
                </Typography>
            </Paper>
            { /* TODO: Export metadata */ }
            { /* TODO: Export access log */ }
        </>
    )
}

export const metadata: Metadata = {
    title: 'Export | AnimeCon Volunteer Manager',
};
