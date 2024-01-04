// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';
import React, { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';

import type { GridRenderCellParams, GridRenderEditCellParams } from '@mui/x-data-grid';
import { default as MuiLink } from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Collapse from '@mui/material/Collapse';
import Paper from '@mui/material/Paper';
import ReportIcon from '@mui/icons-material/Report';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useGridApiContext } from '@mui/x-data-grid';

import type { HotelBooking, HotelRequest } from './HotelBookings';
import type { HotelConfigurationEntry } from './HotelConfiguration';
import type { PageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import { type DataTableColumn, OLD_DataTable } from '@app/admin/DataTable';
import { RegistrationStatus } from '@lib/database/Types';
import { dayjs } from '@lib/DateTime';
import { callApi } from '@lib/callApi';

/**
 * Props accepted by the <HotelAssignmentPersonSelect> component.
 */
interface HotelAssignmentPersonSelectProps extends GridRenderEditCellParams {
    /**
     * Names of the volunteers who have requested a hotel room.
     */
    requests: string[];
}

/**
 * The <HotelAssignmentPersonSelect> component displays a select box in which an individual can be
 * typed who will stay in said hotel room. Volunteers who are pending assignment will be suggested.
 */
function HotelAssignmentPersonSelect(props: HotelAssignmentPersonSelectProps) {
    const { field, hasFocus, id } = props;

    const context = useGridApiContext();

    const handleAutocompleteChange = useCallback((event: unknown, value: string) => {
        context.current.setEditCellValue({ id, field, value });
    }, [ context, field, id ]);

    const handleInputChange = useCallback(
        (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
            context.current.setEditCellValue({ id, field, value: event.currentTarget.value });
        }, [ context, field, id ]);

    const ref = useRef<HTMLTextAreaElement | HTMLInputElement>();

    useLayoutEffect(() => {
        if (hasFocus && ref.current)
            ref.current.focus();

    }, [ hasFocus, ref ]);

    return (
        <Autocomplete freeSolo disableClearable fullWidth options={props.requests}
                      value={props.value} onChange={handleAutocompleteChange}
                      renderOption={ (params, option) =>
                          <li {...params} key={option}>{option}</li> }
                      renderInput={ (params) =>
                          <TextField {...params} fullWidth size="small" inputRef={ref}
                                     onChange={handleInputChange} /> } />
    );
}

/**
 * Renders a possibly linkified occupant in one of the assignment table cells.
 */
function RenderLinkifiedOccupant(
    event: PageInfo['event'], occupant?: HotelBooking['occupants'][number])
{
    if (!occupant)
        return undefined;  // this occupant does not exist
    if (!occupant.userId)
        return occupant.name;  // this occupant is not a volunteer

    const href = `/admin/events/${event.slug}/${occupant.userTeam}/volunteers/${occupant.userId}`;
    return (
        <React.Fragment>
            <MuiLink component={Link} href={href}>
                {occupant.name}
            </MuiLink>
            { occupant.userStatus === RegistrationStatus.Cancelled &&
                <Tooltip title="This volunteer no longer participates">
                    <ReportIcon fontSize="small" color="error" sx={{ ml: 1 }} />
                </Tooltip> }
        </React.Fragment>
    );
}

/**
 * Props accepted by the <HotelAssignment> component.
 */
export interface HotelAssignmentProps {
    /**
     * The hotel room bookings that exist for this event.
     */
    bookings: HotelBooking[];

    /**
     * Information about the event for which hotel rooms are being shown.
     */
    event: PageInfo['event'];

    /**
     * The requests that have not been assigned to any rooms yet.
     */
    requests: HotelRequest[];

    /**
     * The hotel rooms that volunteers can be assigned too. Includes removed rooms.
     */
    rooms: HotelConfigurationEntry[];
}

/**
 * The <HotelAssignment> component displays the hotel rooms that have been compiled based on the
 * preferences expressed by the volunteers. This UI currently supports up to three occupants.
 */
export function HotelAssignment(props: HotelAssignmentProps) {
    const { event, rooms } = props;

    const bookings = useMemo(() => props.bookings.map(booking => ({
        id: booking.id,

        firstName: booking.occupants.length > 0 ? booking.occupants[0].name : undefined,
        firstOccupant: booking.occupants[0],

        secondName: booking.occupants.length > 1 ? booking.occupants[1].name : undefined,
        secondOccupant: booking.occupants[1],

        thirdName: booking.occupants.length > 2 ? booking.occupants[2].name : undefined,
        thirdOccupant: booking.occupants[2],

        hotelId: booking.hotel?.id,

        checkIn: booking.checkIn,
        checkOut: booking.checkOut,

        confirmed: booking.confirmed,

    })), [ props.bookings ]);

    const requests = useMemo(() =>
        props.requests.map(request => request.user.name).sort(), [ props.requests ]);

    const router = useRouter();

    type Booking = typeof bookings[number];

    // ---------------------------------------------------------------------------------------------
    // Functions related to creating, updating and deleting hotel bookings
    // ---------------------------------------------------------------------------------------------

    const commitAdd = useCallback(async () => {
        const response = await callApi('post', '/api/admin/hotel-bookings/:slug', {
            slug: props.event.slug,
        });

        return {
            id: response.id,

            firstName: undefined,
            firstOccupant: undefined!,

            secondName: undefined,
            secondOccupant: undefined!,

            thirdName: undefined,
            thirdOccupant: undefined!,

            hotelId: undefined,

            checkIn: dayjs.utc(props.event.startTime).toISOString(),
            checkOut: dayjs.utc(props.event.endTime).toISOString(),

            confirmed: false,
        } satisfies Booking;
    }, [ props.event ]);

    const commitEdit = useCallback(async (newRow: Booking, oldRow: Booking) => {
        const occupants = [];
        if (newRow.firstName && newRow.firstName.length > 0)
            occupants.push(newRow.firstName);
        if (newRow.secondName && newRow.secondName.length > 0)
            occupants.push(newRow.secondName);
        if (newRow.thirdName && newRow.thirdName.length > 0)
            occupants.push(newRow.thirdName);

        const response = await callApi('put', '/api/admin/hotel-bookings/:slug/:id', {
            slug: props.event.slug,
            id: newRow.id,
            occupants,
            hotelId: newRow.hotelId,
            checkIn: dayjs(newRow.checkIn).format('YYYY-MM-DD'),
            checkOut: dayjs(newRow.checkOut).format('YYYY-MM-DD'),
            confirmed: !!newRow.confirmed,
        });

        if (response.success && response.occupants) {
            router.refresh();
            return {
                ...newRow,

                firstOccupant: response.occupants[0],
                firstName: response.occupants[0]?.name,

                secondOccupant: response.occupants[1],
                secondName: response.occupants[1]?.name,

                thirdOccupant: response.occupants[2],
                thirdName: response.occupants[2]?.name,
            };
        }

        return oldRow;

    }, [ props.event, router ]);

    const commitDelete = useCallback(async (oldRow: Booking) => {
        const response = await callApi('delete', '/api/admin/hotel-bookings/:slug/:id', {
            slug: props.event.slug,
            id: oldRow.id,
        });

        if (response.success)
            router.refresh();

    }, [ props.event, router ]);

    // ---------------------------------------------------------------------------------------------
    // Column definition for the assignment table
    // ---------------------------------------------------------------------------------------------

    const columns: DataTableColumn<Booking>[] = useMemo(() => ([
        {
            field: 'id',
            headerName: /* empty= */ '',
            sortable: false,
            width: 50,
        },
        {
            field: 'firstName',
            headerName: 'Booking owner',
            editable: true,
            flex: 1,

            renderCell: params => RenderLinkifiedOccupant(event, params.row.firstOccupant),
            renderEditCell: (params: GridRenderEditCellParams<Booking>) =>
                <HotelAssignmentPersonSelect requests={requests} {...params} />,
        },
        {
            field: 'secondName',
            headerName: 'Second guest',
            editable: true,
            flex: 1,

            renderCell: params => RenderLinkifiedOccupant(event, params.row.secondOccupant),
            renderEditCell: (params: GridRenderEditCellParams<Booking>) =>
                <HotelAssignmentPersonSelect requests={requests} {...params} />,
        },
        {
            field: 'thirdName',
            headerName: 'Third guest',
            editable: true,
            flex: 1,

            renderCell: params => RenderLinkifiedOccupant(event, params.row.thirdOccupant),
            renderEditCell: (params: GridRenderEditCellParams<Booking>) =>
                <HotelAssignmentPersonSelect requests={requests} {...params} />,
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

            renderCell: (params: GridRenderCellParams<Booking>) =>
                dayjs(params.value).format('YYYY-MM-DD'),
        },
        {
            field: 'checkOut',
            headerName: 'Check out',
            editable: true,
            width: 110,

            renderCell: (params: GridRenderCellParams<Booking>) =>
                dayjs(params.value).format('YYYY-MM-DD'),
        },
        {
            field: 'confirmed',
            headerName: 'Booked',
            editable: true,
            sortable: false,
            width: 100,
            type: 'boolean',

            renderCell: (params: GridRenderCellParams<Booking>) => {
                return !!params.value ? <CheckCircleIcon fontSize="small" color="success" />
                                      : <CancelIcon fontSize="small" color="error" />;
            },
        }
    ]), [ event, requests, rooms ]);

    // ---------------------------------------------------------------------------------------------
    // Compute the warnings that should be displayed regarding hotel rooms
    // ---------------------------------------------------------------------------------------------

    const warnings = useMemo(() => {
        const warnings: { volunteer: string; warning: string }[] = [];

        const bookingDates = new Map<number, { min: dayjs.Dayjs; max: dayjs.Dayjs; }>();
        const requestMap = new Map<number, typeof props.requests[number]>();
        const requestProcessed = new Set<number>();

        for (const request of props.requests)
            requestMap.set(request.user.id, request);

        for (const booking of props.bookings) {
            let deletedRoomWarning = false;
            let missingRoomWarning = false;

            for (const occupant of booking.occupants) {
                const volunteer = occupant.name;

                if (!booking.hotel && !missingRoomWarning) {
                    warnings.push({
                        volunteer,
                        warning: 'has been assigned to a booking that doesn\'t have a room',
                    });

                    missingRoomWarning = true;
                }

                if (booking.hotel && !booking.hotel.visible && !deletedRoomWarning) {
                    warnings.push({
                        volunteer,
                        warning: 'has been assigned a hotel room that\'s been deleted',
                    });

                    deletedRoomWarning = true;
                }

                if (occupant.userId) {
                    if (requestProcessed.has(occupant.userId)) {
                        warnings.push({
                            volunteer,
                            warning: 'has been assigned a room multiple times',
                        });

                        continue;
                    }

                    requestProcessed.add(occupant.userId);

                    if (occupant.userStatus === RegistrationStatus.Cancelled) {
                        warnings.push({
                            volunteer,
                            warning: 'cancelled, but has still been assigned a hotel room',
                        });
                    }

                    let [ min, max ] = [
                        dayjs(booking.checkIn),
                        dayjs(booking.checkOut),
                    ];

                    if (bookingDates.has(occupant.userId)) {
                        const dates = bookingDates.get(occupant.userId)!;
                        if (dates.min.isBefore(min))
                            min = dates.min;
                        if (dates.max.isAfter(max))
                            max = dates.max;
                    }

                    bookingDates.set(occupant.userId, { min, max });

                    const request = requestMap.get(occupant.userId);
                    if (!request)
                        continue;

                    if (booking.hotel && request.hotel.id !== booking.hotel.id) {
                        warnings.push({
                            volunteer,
                            warning: 'has been assigned a room different from their preferences',
                        });
                    }
                }
            }
        }

        for (const request of props.requests) {
            if (!bookingDates.has(request.user.id))
                continue;  // this user has not been assigned a room yet

            const { min, max } = bookingDates.get(request.user.id)!;

            if (!min.isSame(request.checkIn, 'day')) {
                warnings.push({
                    volunteer: request.user.name,
                    warning:
                        `requested check-in on ${dayjs(request.checkIn).format('YYYY-MM-DD')}, ` +
                        `but is booked in from ${min.format('YYYY-MM-DD')}`,
                });
            }

            if (!max.isSame(request.checkOut, 'day')) {
                warnings.push({
                    volunteer: request.user.name,
                    warning:
                        `requested check-out on ${dayjs(request.checkOut).format('YYYY-MM-DD')}, ` +
                        `but is booked in until ${max.format('YYYY-MM-DD')}`,
                });
            }
        }

        warnings.sort((lhs, rhs) => {
            if (lhs.volunteer !== rhs.volunteer)
                return lhs.volunteer.localeCompare(rhs.volunteer);

            return lhs.warning.localeCompare(rhs.warning);
        });

        return warnings;

    }, [ props ]);

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
            <OLD_DataTable commitAdd={commitAdd} commitDelete={commitDelete} commitEdit={commitEdit}
                           messageSubject="assignment" rows={bookings} columns={columns}
                           dense disableFooter pageSize={50} pageSizeOptions={[ 50 ]} />
            <Collapse in={warnings.length > 0}>
                <Alert severity="warning" sx={{ mt: 2 }}>
                    <Stack direction="column" spacing={0} sx={{ maxWidth: '100%' }}>
                        { warnings.map(({ volunteer, warning }, index) =>
                            <Typography key={index} variant="body2">
                                <strong>{volunteer}</strong> {warning}
                            </Typography> )}
                    </Stack>
                </Alert>
            </Collapse>
        </Paper>
    );
}
