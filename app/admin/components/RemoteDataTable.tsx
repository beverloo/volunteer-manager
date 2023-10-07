// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useEffect, useState } from 'react';

import type { GridColDef, GridValidRowModel } from '@mui/x-data-grid';
import { DataGrid } from '@mui/x-data-grid';

import Alert from '@mui/material/Alert';
import Collapse from '@mui/material/Collapse';

import { type ApiEndpoints, callApi } from '@lib/callApi';

/**
 * Props accepted by the <RemoteDataTable> component.
 */
interface RemoteDataTableProps<Endpoint extends keyof ApiEndpoints['get'],
                               RowModel extends GridValidRowModel> {
    /**
     * Columns accepted by the data table.
     */
    columns: GridColDef<RowModel>[];

    /**
     * Whether new rows can be deleted. When set, this will display a _create_ icon in the header
     * of the first column. Creation will send a POST request to the server.
     */
    enableCreate?: [Endpoint extends keyof ApiEndpoints['post'] ? boolean : false];

    /**
     * Whether rows can be deleted. When set, this will display a _delete_ icon as the first column
     * of every row. Deletion will only happen after the user confirms the operation.
     */
    enableDelete?: [`${Endpoint}/:id` extends keyof ApiEndpoints['delete'] ? boolean : false];

    /**
     * Whether rows can be updated. When set, rows can be double clicked to move to edit mode, after
     * which the full row will be sent to the server using a PUT request.
     */
    enableUpdate?: [`${Endpoint}/:id` extends keyof ApiEndpoints['put'] ? boolean : false];

    /**
     * The endpoint through which the remote data table can exercise operations. The following
     * interface is expected to be available:
     *
     * * DELETE /your/endpoint/:id  - Delete an individual row (when `enableDelete` is set)
     * * GET /your/endpoint         - Retrieve all rows, in a paginated format
     * * POST /your/endpoint        - Create a new row (when `enableCreate` is set)
     * * PUT /your/endpoint/:id     - Update an existing row (when `enableUpdate` is set)
     *
     * Endpoints will only be considered when the corresponding `enable{Create,Delete,Update}` flag
     * has been set on the remote data table. TypeScript will validate existence of the APIs.
     */
    endpoint: Endpoint;

    /**
     * Additional parameters that should be passed to the endpoint. The internal params for enabling
     * pagination, sorting and filtering are not relevant here, as <RemoteDataTable> will add them.
     */
    endpointParams:
        Omit<ApiEndpoints['get'][Endpoint]['request'], 'page' | 'sort' | 'sortDirection'>;
}

/**
 * The <RemoteDataTable> component is an implementation of the MUI-X DataGrid component that
 * displays data from a remote source, following a predefined interface. Remote sources follow a
 * consistent REST pattern and can therefore easily be set to accept full CRUD operations.
 */
export function RemoteDataTable<
    Endpoint extends keyof ApiEndpoints['get'],
    RowModel extends GridValidRowModel = GridValidRowModel>
(
    props: RemoteDataTableProps<Endpoint, RowModel>)
{
    const [ error, setError ] = useState<string | undefined>();
    const [ loading, setLoading ] = useState<boolean>(true);

    // ---------------------------------------------------------------------------------------------
    // Capability: (C)reate new rows
    // ---------------------------------------------------------------------------------------------

    // TODO

    // ---------------------------------------------------------------------------------------------
    // Capability: (R)ead existing rows
    // ---------------------------------------------------------------------------------------------

    // TODO: Support `page`
    // TODO: Support `sort`
    // TODO: Support `sortDirection`

    const [ rows, setRows ] = useState<RowModel[]>([ /* no rows */]);
    useEffect(() => {
        setError(undefined);
        callApi('get', props.endpoint, props.endpointParams as any)
            .then((response: any) => {
                setRows(response.rows);
            })
            .catch(error => {
                setError(`Unable to fetch the information (${error.message})`)
            })
            .finally(() => setLoading(false));

    }, [ props.endpoint, props.endpointParams ]);

    // ---------------------------------------------------------------------------------------------
    // Capability: (U)pdate existing rows
    // ---------------------------------------------------------------------------------------------

    // TODO

    // ---------------------------------------------------------------------------------------------
    // Capability: (D)elete existing rows
    // ---------------------------------------------------------------------------------------------

    // TODO

    // ---------------------------------------------------------------------------------------------

    const columns = props.columns;

    return (
        <>
            <Collapse in={!!error}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            </Collapse>
            <DataGrid columns={columns} rows={rows}
                      autoHeight density="compact" disableColumnMenu hideFooterSelectedRowCount
                      loading={loading} />
        </>
    );
}
