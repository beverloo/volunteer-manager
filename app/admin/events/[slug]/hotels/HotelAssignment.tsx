// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';

import type { GridRenderCellParams } from '@mui/x-data-grid';
import { default as MuiLink } from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import type { PageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import { type DataTableColumn, DataTable } from '@app/admin/DataTable';
import { dayjs } from '@lib/DateTime';

/**
 * Props accepted by the <HotelAssignment> component.
 */
export interface HotelAssignmentProps {
    /**
     * The hotel room assignments that have been created for this event.
     */
    assignments: {

    }[];

    /**
     * Information about the event for which hotel rooms are being shown.
     */
    event: PageInfo['event'];
}

/**
 * The <HotelAssignment> component displays the hotel rooms that have been compiled based on the
 * preferences expressed by the volunteers.
 */
export function HotelAssignment(props: HotelAssignmentProps) {
    const { event } = props;

    const columns: DataTableColumn[] = [
        {
            field: 'firstName',
            headerName: 'First guest',
            flex: 1,

            // guest format
        },
        {
            field: 'secondName',
            headerName: 'Second guest',
            flex: 1,

            // guest format
        },
        {
            field: 'thirdName',
            headerName: 'Third guest',
            flex: 1,

            // guest format
        },

        {
            field: 'hotelName',
            headerName: 'Hotel room',
            flex: 1,

            // joint format
        },

        {
            field: 'checkIn',
            headerName: 'Check in',
            width: 110,

            renderCell: (params: GridRenderCellParams) => dayjs(params.value).format('YYYY-MM-DD'),
        },
        {
            field: 'checkOut',
            headerName: 'Check out',
            width: 110,

            renderCell: (params: GridRenderCellParams) => dayjs(params.value).format('YYYY-MM-DD'),
        },

        {
            field: 'booked',
            headerName: 'Booked',
            width: 100,
            sortable: false,
            type: 'boolean',
        }
    ];

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ pb: 1 }}>
                Hotel rooms
                <Typography component="span" variant="h5" color="action.active" sx={{ pl: 1 }}>
                    ({event.shortName})
                </Typography>
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
                The following list describes our hotel rooms for <strong>{event.shortName}</strong>.
                Check the "booked" column when the room has been requested using the official{' '}
                { event.hotelRoomForm
                    ? <MuiLink component={Link} href={event.hotelRoomForm}>hotel room form</MuiLink>
                    : 'hotel room form' }
                , after which we consider the booking as confirmed.
            </Alert>
            <DataTable rows={props.assignments} columns={columns} dense disableFooter />
        </Paper>
    );
}
