// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useMemo } from 'react';
import Link from 'next/link';

import type { GridRenderCellParams } from '@mui/x-data-grid';
import { default as MuiLink } from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import type { HotelRequest } from './HotelBookings';
import { type DataTableColumn, OLD_DataTable } from '@app/admin/DataTable';
import { dayjs } from '@lib/DateTime';

/**
 * Props accepted by the <HotelPendingAssignment> component.
 */
export interface HotelPendingAssignmentProps {
    /**
     * The requests that have not been assigned to any rooms yet.
     */
    requests: HotelRequest[];
}

/**
 * The <HotelPendingAssignment> component displays the volunteers who have expressed interest in
 * having a hotel room booking, but have not been assigned a room just yet.
 */
export function HotelPendingAssignment(props: HotelPendingAssignmentProps) {
    const requests = useMemo(() => props.requests.map(request => ({
        id: request.id,

        userId: request.user.id,
        userName: request.user.name,
        userTeam: request.user.team,

        hotel: `${request.hotel.name} (${request.hotel.roomName})`,

        checkIn: request.checkIn,
        checkOut: request.checkOut,
        updated: request.updated,

    })), [ props.requests ]);

    type PendingRequest = typeof requests[number];

    const columns: DataTableColumn<PendingRequest>[] = [
        {
            field: 'userName',
            headerName: 'Volunteer',
            flex: 2,

            renderCell: (params: GridRenderCellParams<PendingRequest>) => {
                const href = `./${params.row.userTeam}/volunteers/${params.row.userId}`;
                return (
                    <MuiLink component={Link} href={href}>
                        {params.value}
                    </MuiLink>
                );
            },
        },
        {
            field: 'hotel',
            headerName: 'Hotel room',
            flex: 3,
        },
        {
            field: 'checkIn',
            headerName: 'Check in',
            width: 110,

            renderCell: (params: GridRenderCellParams<PendingRequest>) =>
                dayjs(params.value).format('YYYY-MM-DD'),
        },
        {
            field: 'checkOut',
            headerName: 'Check out',
            width: 110,

            renderCell: (params: GridRenderCellParams<PendingRequest>) =>
                dayjs(params.value).format('YYYY-MM-DD'),
        },
        {
            field: 'updated',
            headerName: 'Requested',
            width: 110,

            renderCell: (params: GridRenderCellParams<PendingRequest>) =>
                dayjs(params.value).format('YYYY-MM-DD'),
        }
    ];

    return (
        <Paper sx={{ p: 2, mt: 2 }}>
            <Typography variant="h5" sx={{ pb: 1 }}>
                Pending assignment
            </Typography>
            <OLD_DataTable rows={requests} columns={columns} disableFooter dense
                           pageSize={50} pageSizeOptions={[ 50 ]} />
        </Paper>
    );
}
