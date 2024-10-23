// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import type { NextPageParams } from '@lib/NextRouterParams';
import { ExportAccess } from './ExportAccess';
import { ExportMetadata } from './ExportMetadata';
import { hasAccessToExport } from '../ExportPrivileges';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';
import db, { tEvents, tExportsLogs, tExports, tUsers } from '@lib/database';


/**
 * The <VolunteersExportDetailsPage> component is the page that displays detailed information about
 * a particular data export. This includes both metadata and access logs.
 */
export default async function VolunteersExportDetailsPage(props: NextPageParams<'id'>) {
    const { access } = await requireAuthenticationContext({
        check: 'admin',
        permission: 'volunteer.export',
    });

    const params = await props.params;

    const exportsLogsJoin = tExportsLogs.forUseInLeftJoin();

    const dbInstance = db;
    const data = await dbInstance.selectFrom(tExports)
        .innerJoin(tEvents)
            .on(tEvents.eventId.equals(tExports.exportEventId))
        .innerJoin(tUsers)
            .on(tUsers.userId.equals(tExports.exportCreatedUserId))
        .leftJoin(exportsLogsJoin)
            .on(exportsLogsJoin.exportId.equals(tExports.exportId))
        .where(tExports.exportId.equals(parseInt(params.id, 10)))
        .select({
            date: dbInstance.dateTimeAsString(tExports.exportCreatedDate),
            slug: tExports.exportSlug,
            type: tExports.exportType,
            eventName: tEvents.eventShortName,
            expirationDate: dbInstance.dateTimeAsString(tExports.exportExpirationDate),
            expirationViews: tExports.exportExpirationViews,
            justification: tExports.exportJustification,
            userId: tExports.exportCreatedUserId,
            userName: tUsers.name,
            views: dbInstance.count(exportsLogsJoin.accessDate)
        })
        .groupBy(tExports.exportId)
        .executeSelectNoneOrOne();

    if (!data || !hasAccessToExport(data.type, access))
        notFound();

    const usersJoin = tUsers.forUseInLeftJoin();

    const views = await dbInstance.selectFrom(tExportsLogs)
        .leftJoin(usersJoin)
            .on(usersJoin.userId.equals(tExportsLogs.accessUserId))
        .where(tExportsLogs.exportId.equals(parseInt(params.id, 10)))
        .select({
            id: tExportsLogs.exportLogId,
            date: dbInstance.dateTimeAsString(tExportsLogs.accessDate),
            userIp: tExportsLogs.accessIpAddress,
            userAgent: tExportsLogs.accessUserAgent,

            userId: tExportsLogs.accessUserId,
            userName: usersJoin.name,
        })
        .executeSelectMany();

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
            <ExportAccess views={views} />
        </>
    )
}

export const metadata: Metadata = {
    title: 'Export | AnimeCon Volunteer Manager',
};
