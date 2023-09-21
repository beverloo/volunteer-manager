// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import { OutboxDataTable } from './OutboxDataTable';
import { Privilege, can } from '@lib/auth/Privileges';
import { requireUser } from '@lib/auth/getUser';

/**
 * The outbox page summarises all outgoing e-mail messages, and tells the volunteer whether they
 * have been successfully sent or ran into an issue somewhere. This page is only available to those
 * with specific permissions, as messages may contain e.g. password reset links.
 */
export default async function OutboxPage() {
    const user = await requireUser();
    if (!can(user, Privilege.SystemOutboxAccess))
        notFound();

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ pb: 2 }}>
                Outbox
            </Typography>
            <OutboxDataTable />
        </Paper>
    );
}

export const metadata: Metadata = {
    title: 'Outbox | AnimeCon Volunteer Manager',
};
