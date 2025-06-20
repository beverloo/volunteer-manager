// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Link from 'next/link';
import { notFound } from 'next/navigation';

import { default as MuiLink } from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import type { NextPageParams } from '@lib/NextRouterParams';
import { BackButtonGrid } from '@app/admin/components/BackButtonGrid';
import { LocalDateTime } from '@app/admin/components/LocalDateTime';
import { ShareableLink } from './ShareableLink';
import { createGenerateMetadataFn } from '@app/admin/lib/generatePageMetadata';
import { determineEnvironment } from '@lib/Environment';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';
import db, { tEvents, tExportsLogs, tExports, tUsers } from '@lib/database';
import { AccessLogsDataTable } from './AccessLogsDataTable';

/**
 * The <OrganisationExportsLogPage> component displays the information associated with a singular
 * data export entry, with a focus on the motivation and access logs.
 */
export default async function OrganisationExportsLogPage(props: NextPageParams<'id'>) {
    await requireAuthenticationContext({
        check: 'admin',
        permission: 'organisation.exports'
    });

    const environment = await determineEnvironment();
    if (!environment)
        notFound();

    const { id } = await props.params;

    const exportsLogsJoin = tExportsLogs.forUseInLeftJoin();

    const dbInstance = db;
    const data = await dbInstance.selectFrom(tExports)
        .innerJoin(tEvents)
            .on(tEvents.eventId.equals(tExports.exportEventId))
        .innerJoin(tUsers)
            .on(tUsers.userId.equals(tExports.exportCreatedUserId))
        .leftJoin(exportsLogsJoin)
            .on(exportsLogsJoin.exportId.equals(tExports.exportId))
        .where(tExports.exportId.equals(parseInt(id, /* radix= */ 10)))
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

    if (!data)
        notFound();

    const usersJoin = tUsers.forUseInLeftJoin();

    const views = await dbInstance.selectFrom(tExportsLogs)
        .leftJoin(usersJoin)
            .on(usersJoin.userId.equals(tExportsLogs.accessUserId))
        .where(tExportsLogs.exportId.equals(parseInt(id, 10)))
        .select({
            id: tExportsLogs.exportLogId,
            date: dbInstance.dateTimeAsString(tExportsLogs.accessDate),
            userIp: tExportsLogs.accessIpAddress,
            userAgent: tExportsLogs.accessUserAgent,

            userId: tExportsLogs.accessUserId,
            userName: usersJoin.name,
        })
        .executeSelectMany();

    const shareableLink = `https://${environment.domain}/exports/${data.slug}`;

    return (
        <Grid container spacing={2}>
            <BackButtonGrid href="/admin/organisation/exports">
                Back to export logs
            </BackButtonGrid>

            <Grid size={{ xs: 12 }}>
                <Table size="small" sx={{ mt: -1 }}>
                    <TableBody>
                        <TableRow>
                            <TableCell variant="head" width="25%">
                                Shareable link
                            </TableCell>
                            <TableCell>
                                <ShareableLink href={shareableLink} />
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell variant="head">
                                Expiration date
                            </TableCell>
                            <TableCell>
                                <LocalDateTime dateTime={data.expirationDate}
                                               format="MMMM D, YYYY [at] HH:mm:ss" />
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell variant="head">
                                Expiration views
                            </TableCell>
                            <TableCell>
                                {data.expirationViews} (seen: {data.views})
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell variant="head">
                                Exported by
                            </TableCell>
                            <TableCell>
                                <MuiLink component={Link}
                                         href={`/admin/organisation/accounts/${data.userId}`}>
                                    {data.userName}
                                </MuiLink> on{' '}
                                <LocalDateTime dateTime={data.date}
                                               format="MMMM D, YYYY [at] HH:mm:ss" />
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell variant="head">
                                Exported data
                            </TableCell>
                            <TableCell>
                                {data.eventName} {data.type}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell variant="head">
                                Justification
                            </TableCell>
                            <TableCell>
                                {data.justification}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </Grid>

            { !!views.length &&
                <>
                    <Grid size={{ xs: 12 }}>
                        <Typography variant="h6" sx={{ mb: -1 }}>
                            Access logs
                        </Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <AccessLogsDataTable views={views} />
                    </Grid>
                </> }

        </Grid>
    );
}

export const generateMetadata = createGenerateMetadataFn('Logs', 'Exports', 'Organisation');
