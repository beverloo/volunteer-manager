// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';

import { default as MuiLink } from '@mui/material/Link';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import type { ExportsRowModel } from '@app/api/admin/exports/[[...id]]/route';
import { RemoteDataTable, type RemoteDataTableColumn } from '@app/admin/components/RemoteDataTable';
import { Temporal, formatDate, formatDuration } from '@lib/Temporal';

/**
 * The <ExportTable> component lists all exports, both active and past. Entries may be deleted
 * (which will deactivate them), whereas each entry links through to a details page.
 */
export function ExportTable() {
    const now = Temporal.Now.zonedDateTimeISO('UTC');

    const columns: RemoteDataTableColumn<ExportsRowModel>[] = [
        {
            field: 'id',
            headerName: /* empty= */ '',
            sortable: false,
            width: 50,

            // Rows can only be "deleted" when the export is still accessible. This is determined by
            // three individual fields, each of which can lock availability.
            isProtected: params =>
                !params.row.enabled ||
                params.row.views >= params.row.expirationViews ||
                Temporal.ZonedDateTime.compare(
                    now, Temporal.ZonedDateTime.from(params.row.expirationDate)) >= 0
        },
        {
            field: 'event',
            headerName: 'Exported data',
            sortable: true,
            flex: 2,

            renderCell: params =>
                <MuiLink component={Link} href={`./exports/${params.row.id}`}>
                    {params.value} {params.row.type}{' '}
                    ({params.row.justification})
                </MuiLink>,
        },
        {
            field: 'createdBy',
            headerName: 'Responsible',
            sortable: true,
            flex: 1,

            renderCell: params =>
                <MuiLink component={Link} href={`./${params.row.createdByUserId}`}>
                    {params.value}
                </MuiLink>
        },
        {
            field: 'expirationDate',
            headerName: 'Expiration time',
            sortable: true,
            flex: 1,

            renderCell: params => {
                const value = Temporal.ZonedDateTime.from(params.value);
                if (Temporal.ZonedDateTime.compare(now, value) >= 0) {
                    return (
                        <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                            expired
                        </Typography>
                    );
                } else {
                    return (
                        <Tooltip title={formatDate(value, 'YYYY-MM-DD [at] HH:mm:ss')}>
                            <Typography variant="body2">
                                { formatDuration(now.until(value)) }
                            </Typography>
                        </Tooltip>
                    );
                }
            },
        },
        {
            field: 'expirationViews',
            headerName: 'Access limits',
            sortable: true,
            flex: 1,

            renderCell: params =>
                <Typography variant="body2">
                    {params.row.views}{' '}
                    <Typography component="span" variant="body2" sx={{ color: 'text.disabled' }}>
                        / {params.value}
                    </Typography>
                </Typography>
        }
    ];

    return (
        <RemoteDataTable columns={columns} endpoint="/api/admin/exports" enableDelete
                         defaultSort={{ field: 'createdOn', sort: 'desc' }} pageSize={25} />
    );
}
