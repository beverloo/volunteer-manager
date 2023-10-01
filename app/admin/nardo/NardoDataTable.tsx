// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';
import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import type { GridRenderCellParams, GridValidRowModel } from '@mui/x-data-grid';
import { default as MuiLink } from '@mui/material/Link';

import type { DataTableColumn, DataTableRowRequest } from '@app/admin/DataTable';
import { DataTable } from '../DataTable';
import { callApi } from '@lib/callApi';
import { dayjs } from '@lib/DateTime';

/**
 * The <NardoDataTable> component displays
 */
export function NardoDataTable() {
    const columns: DataTableColumn[] = useMemo(() => ([
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
    ]), [ /* no deps */ ]);

    const router = useRouter();

    const commitAdd = useCallback(async (): Promise<GridValidRowModel> => {
        return await callApi('post', '/api/nardo', { /* no parameters */ });
    }, [ /* no deps */ ]);

    const commitDelete = useCallback(async (row: GridValidRowModel): Promise<void> => {
        await callApi('delete', '/api/nardo/:id', { id: row.id });
    }, [ /* no deps */ ]);

    const commitEdit = useCallback(async (
        newRow: GridValidRowModel, oldRow: GridValidRowModel): Promise<GridValidRowModel> =>
    {
        const response = await callApi('put', '/api/nardo/:id', {
            id: newRow.id,
            advice: newRow.advice,
        });

        if (response.success)
            router.refresh();

        return response.success ? newRow : oldRow;
    }, [ router ]);

    const onRequestRows = useCallback(async (request: DataTableRowRequest) => {
        let sort: 'advice' | 'authorName' | 'date' = 'date';
        let sortDirection: 'asc' | 'desc' | null | undefined = 'desc';

        if (request.sortModel.length > 0) {
            sort = request.sortModel[0].field as any;
            sortDirection = request.sortModel[0].sort;
        }

        return await callApi('get', '/api/nardo', {
            page: request.page,
            sort, sortDirection,
        });
    }, [ /* no deps */ ]);

    return <DataTable dense onRequestRows={onRequestRows} columns={columns}
                      commitAdd={commitAdd} commitDelete={commitDelete} commitEdit={commitEdit}
                      initialSortItem={ { field: 'date', sort: 'desc' }} messageSubject="advice"
                      pageSize={100} pageSizeOptions={[ 100 ]} />;
}
