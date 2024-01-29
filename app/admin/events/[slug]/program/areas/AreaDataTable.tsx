// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Box from '@mui/material/Box';

import type { ProgramAreasContext, ProgramAreasRowModel } from '@app/api/admin/program/areas/[[...id]]/route';
import { RemoteDataTable, type RemoteDataTableColumn } from '@app/admin/components/RemoteDataTable';

/**
 * Props accepted by the <AreaDataTable> component.
 */
export type AreaDataTableProps = ProgramAreasContext['context'];

/**
 * The <AreaDataTable> component displays an editable data table containing the areas we use during
 * a given event, identified by the `festivalId`. Internal entries are fully editable, whereas
 * entries sourced from AnPlan are read-only except for the ability to set a custom name.
 */
export function AreaDataTable(context: AreaDataTableProps) {
    const columns: RemoteDataTableColumn<ProgramAreasRowModel>[] = [
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
            headerName: 'Area name',
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
            field: 'type',  // AnPlan link
            headerName: '',
            editable: false,
            sortable: false,
            width: 50,
        }
    ];

    return (
        <Box sx={{ p: 2 }}>
            <RemoteDataTable endpoint="/api/admin/program/areas" context={context}
                             columns={columns} defaultSort={{ field: 'name', sort: 'asc' }}
                             disableFooter enableCreate enableDelete enableUpdate refreshOnUpdate
                             pageSize={100} subject="area" />
        </Box>
    );
}
