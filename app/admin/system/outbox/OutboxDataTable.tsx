// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useMemo } from 'react';
import Link from 'next/link';

import type { GridRenderCellParams, GridValueGetterParams } from '@mui/x-data-grid';
import { default as MuiLink } from '@mui/material/Link';

import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReadMoreIcon from '@mui/icons-material/ReadMore';

import type { DataTableColumn, DataTableRowRequest } from '@app/admin/DataTable';
import { OLD_DataTable } from '../../DataTable';
import { Temporal, formatDate } from '@lib/Temporal';
import { callApi } from '@lib/callApi';
import { dayjs } from '@lib/DateTime';

/**
 * The <OutboxDataTable> component displays all e-mail messages that have been sent by the AnimeCon
 * Volunteer Manager. Each message can be clicked on to see further details and content. Access is
 * restricted to certain volunteers.
 */
export function OutboxDataTable() {
    const localTz = Temporal.Now.timeZoneId();

    const columns: DataTableColumn[] = [
        {
            field: 'id',
            headerName: '',
            sortable: false,
            width: 50,

            renderCell: (params: GridRenderCellParams) =>
                <MuiLink component={Link} href={`./outbox/${params.value}`} sx={{ pt: '4px' }}>
                    <ReadMoreIcon color="info" />
                </MuiLink>,
        },
        {
            field: 'date',
            headerName: 'Date',
            width: 150,

            renderCell: (params: GridRenderCellParams) =>
                formatDate(
                    Temporal.ZonedDateTime.from(params.value).withTimeZone(localTz),
                    'YYYY-MM-DD HH:mm:ss'),
        },
        {
            field: 'from',
            headerName: 'Sender',
            sortable: true,
            flex: 2,

            renderCell: (params: GridRenderCellParams) => {
                if (!params.row.fromUserId)
                    return params.value;

                return (
                    <MuiLink component={Link} href={`/admin/volunteers/${params.row.fromUserId}`}>
                        {params.value}
                    </MuiLink>
                );
            },
        },
        {
            field: 'to',
            headerName: 'Recipient',
            sortable: true,
            flex: 2,

            renderCell: (params: GridRenderCellParams) => {
                if (!params.row.fromUserId)
                    return params.value;

                return (
                    <MuiLink component={Link} href={`/admin/volunteers/${params.row.fromUserId}`}>
                        {params.value}
                    </MuiLink>
                );
            },
        },
        {
            field: 'subject',
            headerName: 'Subject',
            sortable: true,
            flex: 3,

            renderCell: (params: GridRenderCellParams) =>
                <MuiLink component={Link} href={`./outbox/${params.row.id}`}>
                    {params.value}
                </MuiLink>,
        },
        {
            field: 'delivered',
            headerName: 'Accepted',
            headerAlign: 'center',
            align: 'center',
            description: 'Whether the e-mail was accepted by the server',
            sortable: true,
            width: 100,

            renderCell: (params: GridRenderCellParams) =>
                params.value ? <CheckCircleIcon fontSize="small" color="success" />
                             : <CancelIcon fontSize="small" color="error" />,
        },
    ];

    const onRequestRows = useCallback(async (request: DataTableRowRequest) => {
        return await callApi('post', '/api/admin/outbox', {
            page: request.page,
            pageSize: request.pageSize,
            sortModel: request.sortModel as any,
        });
    }, [ /* no deps */ ]);

    return <OLD_DataTable dense onRequestRows={onRequestRows} columns={columns}
                          initialSortItem={ { field: 'date', sort: 'desc' }}
                          pageSize={50} pageSizeOptions={[ 25, 50, 100 ]} />;
}
