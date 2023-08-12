// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';

import { default as MuiLink } from '@mui/material/Link';
import { type GridRenderCellParams } from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import type { LogMessage } from '@lib/LogLoader';
import { type DataTableColumn, DataTable } from '@app/admin/DataTable';

/**
 * Props accepted by the <Logs> component.
 */
export interface LogsProps {
    /**
     * Messages that should be displayed for this user.
     */
    messages: LogMessage[];
}

/**
 * The <Logs> component lists the most recent log messages that were recorded for a particular
 * volunteer. More logs might exist on the system, but will be accessible elsewhere.
 */
export function Logs(props: LogsProps) {
    const { messages } = props;

    const columns: DataTableColumn[] = [
        {
            field: 'severity',
            headerName: 'Severity',
            width: 100,
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
            headerName: 'Source',
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
            headerName: 'Target',
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

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ pb: 1 }}>
                Logs
            </Typography>
            <DataTable dense rows={messages} columns={columns}
                       pageSize={10} pageSizeOptions={[ 10, 25, 50 ]}/>
        </Paper>
    );
}
