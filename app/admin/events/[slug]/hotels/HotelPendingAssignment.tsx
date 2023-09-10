// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';

import type { GridRenderCellParams } from '@mui/x-data-grid';
import { default as MuiLink } from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import { type DataTableColumn, DataTable } from '@app/admin/DataTable';
import { dayjs } from '@lib/DateTime';

/**
 * Props accepted by the <HotelPendingAssignment> component.
 */
export interface HotelPendingAssignmentProps {
    /**
     * The requests that have not been assigned to any rooms yet.
     */
    requests: {
        id: number;

        userId: number;
        userTeam: string;

        requestHotelName: string;
        requestHotelRoom: string;

        requestCheckIn?: Date;
        requestCheckOut?: Date;
        requestUpdated: Date;
    }[];
}

/**
 * The <HotelPendingAssignment> component displays the volunteers who have expressed interest in
 * having a hotel room booking, but have not been assigned a room just yet.
 */
export function HotelPendingAssignment(props: HotelPendingAssignmentProps) {
    const columns: DataTableColumn[] = [
        {
            field: 'userName',
            headerName: 'Volunteer',
            flex: 2,

            renderCell: (params: GridRenderCellParams) => {
                const href = `./${params.row.userTeam}/volunteers/${params.row.userId}`;
                return (
                    <MuiLink component={Link} href={href}>
                        {params.value}
                    </MuiLink>
                );
            },
        },
        {
            field: 'requestHotelName',
            headerName: 'Hotel room',
            flex: 3,

            renderCell: (params: GridRenderCellParams) =>
                `${params.value} (${params.row.requestHotelRoom})`
        },
        {
            field: 'requestCheckIn',
            headerName: 'Check in',
            width: 110,

            renderCell: (params: GridRenderCellParams) => dayjs(params.value).format('YYYY-MM-DD'),
        },
        {
            field: 'requestCheckOut',
            headerName: 'Check out',
            width: 110,

            renderCell: (params: GridRenderCellParams) => dayjs(params.value).format('YYYY-MM-DD'),
        },
        {
            field: 'requestUpdated',
            headerName: 'Requested',
            width: 110,

            renderCell: (params: GridRenderCellParams) => dayjs(params.value).format('YYYY-MM-DD'),
        }
    ];

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ pb: 1 }}>
                Pending assignment
            </Typography>
            <DataTable rows={props.requests} columns={columns} disableFooter dense
                       pageSize={50} pageSizeOptions={[ 50 ]} />
        </Paper>
    );
}
