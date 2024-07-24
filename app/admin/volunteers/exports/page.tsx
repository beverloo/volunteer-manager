// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';
import Link from 'next/link';

import { default as MuiLink } from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import { ExportCreatePanel } from './ExportCreatePanel';
import { ExportTable } from './ExportTable';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';
import db, { tEvents } from '@lib/database';

/**
 * The <VolunteersExportsPage> component is the page that allows data to be exported. Every data
 * export is scoped to a particular event and data type, and has a strict expiration time and access
 * log to indicate who accessed the data, when.
 */
export default async function VolunteersExportsPage() {
    const { user } = await requireAuthenticationContext({
        check: 'admin',
        permission: 'volunteer.export',
    });

    const events = await db.selectFrom(tEvents)
        .where(tEvents.eventHidden.equals(/* false= */ 0))
        .select({
            id: tEvents.eventSlug,
            label: tEvents.eventShortName,
        })
        .orderBy(tEvents.eventStartTime, 'desc')
        .executeSelectMany();

    return (
        <>
            <Paper sx={{ p: 2 }}>
                <Typography variant="h5" sx={{ mb: 1 }}>
                    Exports
                </Typography>
                <Alert severity="warning" sx={{ mb: 2 }}>
                    This page allows you to export potentially sensitive data to share with the
                    broader organisation and our vendors. <strong>{user.firstName}</strong>, you
                    are responsible for making sure that this happens in line with our{' '}
                    <MuiLink component={Link} href="/privacy">
                        GDPR & Data Sharing Policies
                    </MuiLink>.
                </Alert>
                <ExportTable />
            </Paper>
            <ExportCreatePanel events={events} />
        </>
    )
}

export const metadata: Metadata = {
    title: 'Exports | AnimeCon Volunteer Manager',
};
