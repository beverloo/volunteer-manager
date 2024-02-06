// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useMemo } from 'react';
import Link from 'next/link';

import type { GridRenderCellParams } from '@mui/x-data-grid';
import { default as MuiLink } from '@mui/material/Link';

import CircleOutlinedIcon from '@mui/icons-material/CircleOutlined';
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningOutlinedIcon from '@mui/icons-material/WarningOutlined';

import type { DataTableBaseProps, DataTableColumn } from '@app/admin/DataTable';
import type { DataTableRowRequest } from '@app/admin/DataTable';
import { OLD_DataTable } from '../../DataTable';
import { Temporal, formatDate } from '@lib/Temporal';
import { callApi } from '@lib/callApi';

/**
 * Props made available to the <LogsDataTable> component.
 */
export interface LogsDataTableProps extends Omit<DataTableBaseProps, 'dense'> {
    /**
     * Filters to apply to the logs selection. Filters are optional, and will be communicated with
     * the server where the actual filtering will take place.
     */
    filters?: {
        sourceOrTargetUserId?: number;
    };
}

/**
 * The <LogsDataTable> component populates the client-side table with the necessary functions to
 * transform the data and add interaction where applicable.
 */
export function LogsDataTable(props: LogsDataTableProps) {
    const { filters, ...dataTableProps } = props;

    const localTz = Temporal.Now.timeZoneId();

    const columns: DataTableColumn[] = useMemo(() => ([
        {
            field: 'severity',
            headerName: '',
            align: 'center',
            width: 50,

            renderCell: (params: GridRenderCellParams) => {
                switch (params.value) {
                    case 'Debug':
                        return <CircleOutlinedIcon color="action" />;
                    case 'Info':
                        return <InfoOutlinedIcon color="info" />;
                    case 'Warning':
                        return <WarningOutlinedIcon color="warning" />;
                    case 'Error':
                        return <ErrorOutlinedIcon color="error" />;
                }

                return params.value;
            },
        },
        {
            field: 'date',
            headerName: 'Date',
            flex: 1,

            renderCell: (params: GridRenderCellParams) =>
                formatDate(
                    Temporal.ZonedDateTime.from(params.value).withTimeZone(localTz),
                    'YYYY-MM-DD HH:mm:ss'),
        },
        {
            field: 'message',
            headerName: 'Message',
            sortable: false,
            flex: 3,
        },
        {
            field: 'source',
            headerName: 'Source user',
            flex: 1,

            renderCell: (params: GridRenderCellParams) => {
                if (!params.value)
                    return undefined;

                return (
                    <MuiLink component={Link} href={`/admin/volunteers/${params.value.userId}`}>
                        {params.value.name}
                    </MuiLink>
                );
            },
        },
        {
            field: 'target',
            headerName: 'Target user',
            flex: 1,

            renderCell: (params: GridRenderCellParams) => {
                if (!params.value)
                    return undefined;

                return (
                    <MuiLink component={Link} href={`/admin/volunteers/${params.value.userId}`}>
                        {params.value.name}
                    </MuiLink>
                );
            },
        },
    ]), [ localTz ]);

    const onRequestRows = useCallback(async (request: DataTableRowRequest) => {
        return await callApi('post', '/api/admin/logs', {
            filters: {
                sourceOrTargetUserId: filters?.sourceOrTargetUserId,
            },
            page: request.page,
            pageSize: request.pageSize,
            sortModel: request.sortModel as any,
        });
    }, [ filters ]);

    return <OLD_DataTable {...dataTableProps} dense onRequestRows={onRequestRows} columns={columns}
                          initialSortItem={ { field: 'date', sort: 'desc' }} />;
}
