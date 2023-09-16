// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useMemo } from 'react';
import Link from 'next/link';

import type { GridRenderCellParams, GridValidRowModel } from '@mui/x-data-grid';
import { default as MuiLink } from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { HotelConfigurationEntry } from './HotelConfiguration';
import type { PageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import { type DataTableColumn, DataTable } from '@app/admin/DataTable';
import { dayjs } from '@lib/DateTime';
import { callApi } from '@app/lib/callApi';

/**
 * Props accepted by the <HotelAssignment> component.
 */
export interface HotelAssignmentProps {
    /**
     * The hotel room assignments that have been created for this event.
     */
    assignments: {
        id: number;

        firstName?: string;

        secondName?: string;

        thirdName?: string;

        hotelId?: number;
        hotelName?: string;

        checkIn?: Date;
        checkOut?: Date;

        booked?: boolean;
    }[];

    /**
     * Information about the event for which hotel rooms are being shown.
     */
    event: PageInfo['event'];

    /**
     * The hotel rooms that volunteers can be assigned too. Includes removed rooms.
     */
    rooms: HotelConfigurationEntry[];
}

type Assignment = HotelAssignmentProps['assignments'][number];

/**
 * The <HotelAssignment> component displays the hotel rooms that have been compiled based on the
 * preferences expressed by the volunteers.
 */
export function HotelAssignment(props: HotelAssignmentProps) {
    const { event, rooms } = props;

    async function commitAdd(): Promise<Assignment> {
        const response = await callApi('post', '/api/admin/hotel-assignments/:slug', {
            slug: props.event.slug,
        });

        return {
            id: response.id,
            checkIn: event.startTime,
            checkOut: event.endTime,
        };
    }

    async function commitEdit(newRow: Assignment, oldRow: Assignment): Promise<Assignment> {
        console.log(oldRow, newRow);

        const response = await callApi('put', '/api/admin/hotel-assignments/:slug/:id', {
            slug: props.event.slug,
            id: oldRow.id,

            // TODO: First guest
            // TODO: Second guest
            // TODO: Third guest

            hotelId: newRow.hotelId,
            checkIn: dayjs(newRow.checkIn).format('YYYY-MM-DD'),
            checkOut: dayjs(newRow.checkOut).format('YYYY-MM-DD'),
            booked: !!newRow.booked,
        });

        return response.success ? newRow : oldRow;
    }

    async function commitDelete(oldRow: Assignment): Promise<void> {
        await callApi('delete', '/api/admin/hotel-assignments/:slug/:id', {
            slug: props.event.slug,
            id: oldRow.id,
        });
    }

    const columns: DataTableColumn<Assignment>[] = useMemo(() => ([
        {
            field: 'id',
            headerName: /* empty= */ '',
            sortable: false,
            width: 50,
        },

        {
            field: 'firstName',
            headerName: 'First guest',
            editable: true,
            flex: 1,

            // guest format
        },
        {
            field: 'secondName',
            headerName: 'Second guest',
            editable: true,
            flex: 1,

            // guest format
        },
        {
            field: 'thirdName',
            headerName: 'Third guest',
            editable: true,
            flex: 1,

            // guest format
        },

        {
            field: 'hotelId',
            headerName: 'Hotel room',
            editable: true,
            type: 'singleSelect',
            flex: 1,

            valueOptions: rooms.map(room => ({
                value: room.id,
                label: `${room.hotelName} (${room.roomName})`
            })),
        },

        {
            field: 'checkIn',
            headerName: 'Check in',
            editable: true,
            width: 110,
            type: 'date',

            renderCell: (params: GridRenderCellParams) => dayjs(params.value).format('YYYY-MM-DD'),
        },
        {
            field: 'checkOut',
            headerName: 'Check out',
            editable: true,
            width: 110,
            type: 'date',

            renderCell: (params: GridRenderCellParams) => dayjs(params.value).format('YYYY-MM-DD'),
        },

        {
            field: 'booked',
            headerName: 'Booked',
            editable: true,
            sortable: false,
            width: 100,
            type: 'boolean',

            renderCell: (params: GridRenderCellParams) => {
                return !!params.value ? <CheckCircleIcon fontSize="small" color="success" />
                                      : <CancelIcon fontSize="small" color="error" />;
            },
        }
    ]), [ /* deps= */ rooms ]);

    const warnings = useMemo(() => {
        // TODO: Create warnings
        // - Differences in check-in or check-out dates
        // - Differences in hotel room selection

        return [
            { volunteer: 'Person Name', warning: 'Warnings are not supported yet.' },
        ];
    }, [ /* deps= */ rooms ]);

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
            <DataTable commitAdd={commitAdd} commitDelete={commitDelete} commitEdit={commitEdit}
                       messageSubject="assignment" rows={props.assignments} columns={columns}
                       dense disableFooter pageSize={50} pageSizeOptions={[ 50 ]} />
            { warnings.length > 0 &&
                <Alert severity="warning" sx={{ mt: 2 }}>
                    <Stack direction="column" spacing={0} sx={{ maxWidth: '100%' }}>
                        { warnings.map(({ volunteer, warning }, index) =>
                            <Typography key={index} variant="body2">
                                <strong>{volunteer}</strong>: {warning}
                            </Typography> )}
                    </Stack>
                </Alert> }
        </Paper>
    );
}
