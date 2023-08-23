// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';

import type { GridRenderCellParams } from '@mui/x-data-grid';
import { default as MuiLink } from '@mui/material/Link';

import CircleOutlinedIcon from '@mui/icons-material/CircleOutlined';
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningOutlinedIcon from '@mui/icons-material/WarningOutlined';

import type { DataTableBaseProps, DataTableColumn } from '@app/admin/DataTable';
import type { DataTableRowRequest, DataTableRowResponse } from '@app/admin/DataTable';
import type { LogsDefinition } from '@app/api/admin/logs';
import { DataTable } from '../DataTable';
import { issueServerAction } from '@app/lib/issueServerAction';

/**
 * Props made available to the <LogsDataTable> component.
 */
export interface LogsDataTableProps extends DataTableBaseProps {}

/**
 * The <LogsDataTable> component populates the client-side table with the necessary functions to
 * transform the data and add interaction where applicable.
 */
export function LogsDataTable(props: LogsDataTableProps) {
    const columns: DataTableColumn[] = [
        {
            field: 'severity',
            headerName: 'Severity',
            width: 100,

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
            type: 'dateTime',
            flex: 1,
        },
        {
            field: 'message',
            headerName: 'Message',
            flex: 2,
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
    ];

    async function onRequestRows(request: DataTableRowRequest): Promise<DataTableRowResponse> {
        const response = await issueServerAction<LogsDefinition>('/api/admin/logs', {
            page: request.page,
            pageSize: request.pageSize,
        });

        return {
            rowCount: response.rowCount,
            rows: response.rows.map(row => {
                return {
                    ...row,
                    date: new Date(row.date),
                }
            }),
        }
    }

    return (
        <DataTable {...props} onRequestRows={onRequestRows} columns={columns} />
    );
}
