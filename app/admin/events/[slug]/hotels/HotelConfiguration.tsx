// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import type { GridRenderCellParams, GridValidRowModel } from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import type { HotelCreateDefinition } from '@app/api/admin/hotelCreate';
import type { HotelDeleteDefinition } from '@app/api/admin/hotelDelete';
import type { HotelUpdateDefinition } from '@app/api/admin/hotelUpdate';
import { type DataTableColumn, DataTable } from '@app/admin/DataTable';
import { issueServerAction } from '@lib/issueServerAction';

/**
 * Helper function for formatting prices in the configuration data table.
 */
const kPriceFormatter = new Intl.NumberFormat('en-UK', { style: 'currency', currency: 'EUR' });

/**
 * Configuration entry for hotel room items. Can be amended by the machinery on this page.
 */
export interface HotelConfigurationEntry {
    /**
     * Unique ID of this entry in the hotel configuration.
     */
    id: number;

    /**
     * Description of the hotel in which the room is located.
     */
    hotelDescription: string;

    /**
     * Name of the hotel in which the room is located.
     */
    hotelName: string;

    /**
     * Name of the room that can be booked.
     */
    roomName: string;

    /**
     * Capacity of the room.
     */
    roomPeople: number;

    /**
     * Price of the room, in cents.
     */
    roomPrice: number;
}

/**
 * Props accepted by the <HotelConfiguration> component.
 */
export interface HotelConfigurationProps {
    /**
     * Unique slug of the event that these hotel rooms are owned by.
     */
    event: string;

    /**
     * The hotel rooms that can be displayed by this component.
     */
    rooms: HotelConfigurationEntry[];
}

/**
 * The <HotelConfiguration> component allows event administrators to add or remove hotel and hotel
 * rooms to settings. Changes will be reflected on the volunteer portal immediately.
 */
export function HotelConfiguration(props: HotelConfigurationProps) {
    async function commitAdd(): Promise<HotelConfigurationEntry> {
        const response = await issueServerAction<HotelCreateDefinition>('/api/admin/hotel-create', {
            event: props.event,
        });

        if (!response.id)
            throw new Error('The server was unable to create a new hotel room.');

        return {
            id: response.id,
            hotelDescription: '',
            hotelName: '',
            roomName: '',
            roomPeople: 1,
            roomPrice: 0,
        };
    }

    async function commitDelete(oldRow: GridValidRowModel) {
        await issueServerAction<HotelDeleteDefinition>('/api/admin/hotel-delete', {
            event: props.event,
            id: oldRow.id,
        });
    }

    async function commitEdit(newRow: GridValidRowModel, oldRow: GridValidRowModel) {
        const response = await issueServerAction<HotelUpdateDefinition>('/api/admin/hotel-update', {
            event: props.event,
            id: oldRow.id,
            hotelDescription: newRow.hotelDescription,
            hotelName: newRow.hotelName,
            roomName: newRow.roomName,
            roomPeople: newRow.roomPeople,
            roomPrice: newRow.roomPrice,
        });

        return response.success ? newRow : oldRow;
    }

    const columns: DataTableColumn[] = [
        {
            field: 'id',
            headerName: /* empty= */ '',
            sortable: false,
            width: 50,
        },
        {
            field: 'hotelName',
            headerName: 'Hotel (name)',
            editable: true,
            sortable: true,
            flex: 2,
        },
        {
            field: 'hotelDescription',
            headerName: 'Hotel (description)',
            editable: true,
            sortable: false,
            flex: 2,
        },
        {
            field: 'roomName',
            headerName: 'Room (name)',
            editable: true,
            sortable: true,
            flex: 2,
        },
        {
            field: 'roomPeople',
            headerName: 'Room (people)',
            editable: true,
            sortable: true,
            type: 'number',
            flex: 1,
        },
        {
            field: 'roomPrice',
            headerName: 'Room (price)',
            editable: true,
            sortable: true,
            type: 'number',
            flex: 1,

            renderCell: (params: GridRenderCellParams) => {
                return kPriceFormatter.format(params.value / 100);
            },
        }
    ];

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ pb: 2 }}>
                Hotel & room options
            </Typography>
            <DataTable commitAdd={commitAdd} commitDelete={commitDelete} commitEdit={commitEdit}
                       messageSubject="hotel room" rows={props.rooms} columns={columns} />
        </Paper>
    );
}
