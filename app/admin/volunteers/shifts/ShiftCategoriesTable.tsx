// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import type { ValueOptions } from '@mui/x-data-grid';

import type { EventShiftCategoriesRowModel } from '@app/api/admin/event/shifts/categories/[[...id]]/route';
import { ExcitementIcon } from '@app/admin/components/ExcitementIcon';
import { RemoteDataTable, type RemoteDataTableColumn } from '@app/admin/components/RemoteDataTable';

/**
 * The base shift excitement options that can be selected.
 */
const kExcitementOptions: ValueOptions[] = [
    { value: 0.00, label: 'Really boring work' },
    { value: 0.25, label: 'Boring work' },
    { value: 0.50, label: 'Dull work' },
    { value: 0.75, label: 'Nice work' },
    { value: 1.00, label: 'Great work' },
];

/**
 * The <ShiftCategoriesTable> component displays a data table that can be used to create, delete and
 * edit shift categories. The MUI X Data Table reordering feature is used to manage the order.
 */
export function ShiftCategoriesTable() {
    const columns: RemoteDataTableColumn<EventShiftCategoriesRowModel>[] = [
        {
            field: 'id',
            headerName: /* no header= */ '',
            editable: false,
            sortable: false,
            width: 50,
        },
        {
            field: 'name',
            headerName: 'Category',
            editable: true,
            sortable: true,
            flex: 1,
        },
        {
            field: 'excitement',
            headerAlign: 'center',
            headerName: 'Excitement',
            editable: true,
            sortable: true,
            align: 'center',
            width: 200,

            type: 'singleSelect',
            valueOptions: kExcitementOptions,

            renderCell: params =>
                <ExcitementIcon excitement={params.value} />,
        },
        {
            field: 'color',
            headerAlign: 'center',
            headerName: 'Color',
            align: 'center',
            width: 200,
        }
    ];

    return (
        <RemoteDataTable columns={columns} endpoint="/api/admin/event/shifts/categories"
                         defaultSort={{ field: 'order', sort: 'asc' }} subject="category"
                         enableCreate enableDelete enableUpdate pageSize={50} disableFooter />
    );
}
