// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Box from '@mui/material/Box';

import type { ProgramLocationsContext, ProgramLocationsRowModel } from '@app/api/admin/program/locations/[[...id]]/route';
import { RemoteDataTable, type RemoteDataTableColumn } from '@app/admin/components/RemoteDataTable';

/**
 * Props accepted by the <LocationDataTable> component.
 */
export interface LocationDataTableProps {
    /**
     * Areas that exist during this festival, which locations can be located in.
     */
    areas: {
        /**
         * Unique ID of the area that can be selected.
         */
        id: number;

        /**
         * Label of the area as it should be presented to the user.
         */
        label: string;
    }[];

    /**
     * Context to be passed to the underlying `RemoteDataTable` interface.
     */
    context: ProgramLocationsContext['context'];
};

/**
 * The <LocationDataTable> component displays an editable data table containing the locations we use
 * during a given event, identified by the `festivalId`. Internal entries are fully editable,
 * whereas entries sourced from AnPlan are read-only except for the ability to set a custom name.
 */
export function LocationDataTable({ areas, context }: LocationDataTableProps) {
    const columns: RemoteDataTableColumn<ProgramLocationsRowModel>[] = [
        {
            field: 'id',
            headerName: '',
            align: 'center',
            editable: false,
            sortable: false,
            width: 50,
        },
        {
            field: 'type',
            headerName: '',
            align: 'center',
            editable: false,
            sortable: false,
            width: 50,
        },
        {
            field: 'name',
            headerName: 'Location name',
            editable: false,
            sortable: true,
            flex: 1,
        },
        {
            field: 'displayName',
            headerName: 'Display name',
            editable: true,
            sortable: true,
            flex: 1,
        },
        {
            field: 'area',
            headerName: 'Area',
            editable: true,
            sortable: true,
            flex: 1,
        },
        {
            field: 'type',  // AnPlan link
            headerName: '',
            editable: false,
            sortable: false,
            width: 50,
        }
    ];

    return (
        <Box sx={{ p: 2 }}>
            <RemoteDataTable endpoint="/api/admin/program/locations" context={context}
                             columns={columns} defaultSort={{ field: 'name', sort: 'asc' }}
                             disableFooter enableCreate enableDelete enableUpdate refreshOnUpdate
                             pageSize={100} subject="location" />
        </Box>
    );
}
