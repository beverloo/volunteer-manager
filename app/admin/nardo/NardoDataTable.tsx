// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';

import type { GridRenderCellParams } from '@mui/x-data-grid';
import { default as MuiLink } from '@mui/material/Link';

import { type RemoteDataTableColumn, RemoteDataTable } from '../components/RemoteDataTable';

import type { NardoRowModel } from '@app/api/nardo/[[...id]]/route';
import { dayjs } from '@lib/DateTime';

/**
 * The <NardoDataTable> component displays
 */
export function NardoDataTable() {
    const columns: RemoteDataTableColumn<NardoRowModel>[] = [
        {
            field: 'id',
            headerName: /* empty= */ '',
            sortable: false,
            width: 50,
        },
        {
            field: 'advice',
            headerName: 'Advice',
            sortable: true,
            editable: true,
            flex: 3,
        },
        {
            field: 'authorName',
            headerName: 'Author',
            sortable: true,
            filterable: true,
            flex: 1,

            renderCell: (params: GridRenderCellParams) => {
                return (
                    <MuiLink component={Link} href={`/admin/volunteers/${params.row.authorUserId}`}>
                        {params.value}
                    </MuiLink>
                );
            },
        },
        {
            field: 'date',
            headerName: 'Date',
            sortable: true,
            flex: 1,

            renderCell: (params: GridRenderCellParams) => dayjs(params.value).format('YYYY-MM-DD'),
        },
    ];

    return <RemoteDataTable columns={columns} endpoint="/api/nardo"
                            defaultSort={{ field: 'date', sort: 'desc' }}
                            enableCreate enableDelete enableUpdate subject="piece of advice" />;
}
