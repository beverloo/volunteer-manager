// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import type { NextRouterParams } from '@lib/NextRouterParams';
import { ExportMetadata } from './ExportMetadata';
import { Privilege } from '@lib/auth/Privileges';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';
import db, { tEvents, tExportsLogs, tExports, tUsers } from '@lib/database';

/**
 * The <VolunteersExportDetailsPage> component is the page that displays detailed information about
 * a particular data export. This includes both metadata and access logs.
 */
export default async function VolunteersExportDetailsPage(props: NextRouterParams<'id'>) {
    await requireAuthenticationContext({
        check: 'admin',
        privilege: Privilege.VolunteerDataExports,
    });

    const exportsLogsJoin = tExportsLogs.forUseInLeftJoin();

    const dbInstance = db;
    const data = await dbInstance.selectFrom(tExports)
        .innerJoin(tEvents)
            .on(tEvents.eventId.equals(tExports.exportEventId))
        .innerJoin(tUsers)
            .on(tUsers.userId.equals(tExports.exportCreatedUserId))
        .leftJoin(exportsLogsJoin)
            .on(exportsLogsJoin.exportId.equals(tExports.exportId))
        .where(tExports.exportId.equals(parseInt(props.params.id, 10)))
        .select({
            date: tExports.exportCreatedDate,
            slug: tExports.exportSlug,
            type: tExports.exportType,
            eventName: tEvents.eventShortName,
            expirationDate: tExports.exportExpirationDate,
            expirationViews: tExports.exportExpirationViews,
            justification: tExports.exportJustification,
            userId: tExports.exportCreatedUserId,
            userName: tUsers.firstName.concat(' ').concat(tUsers.lastName),
            views: dbInstance.count(exportsLogsJoin.accessDate)
        })
        .groupBy(tExports.exportId)
        .executeSelectNoneOrOne();

    if (!data)
        notFound();

    return (
        <>
            <Paper sx={{ p: 2 }}>
                <Typography variant="h5" sx={{ mb: 1 }}>
                    Exports
                </Typography>
                <Alert severity="info" sx={{ mb: 1 }}>
                    Data exports are immutable—instead, create a new export and <em>delete</em> this
                    export if necessary.
                </Alert>
                <ExportMetadata metadata={data} />
            </Paper>
            { /* TODO: Export access log */ }
        </>
    )
}

export const metadata: Metadata = {
    title: 'Export | AnimeCon Volunteer Manager',
};
