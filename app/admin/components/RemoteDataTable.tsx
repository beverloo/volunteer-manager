// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { GridColDef, GridPaginationModel, GridSortItem, GridSortModel, GridValidRowModel } from '@mui/x-data-grid';
import { DataGrid } from '@mui/x-data-grid';

import AddCircleIcon from '@mui/icons-material/AddCircle';
import Alert from '@mui/material/Alert';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

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
    enableCreate?: Endpoint extends keyof ApiEndpoints['post'] ? boolean : false;

    /**
     * Whether rows can be deleted. When set, this will display a _delete_ icon as the first column
     * of every row. Deletion will only happen after the user confirms the operation.
     */
    enableDelete?: `${Endpoint}/:id` extends keyof ApiEndpoints['delete'] ? boolean : false;

    /**
     * Whether rows can be updated. When set, rows can be double clicked to move to edit mode, after
     * which the full row will be sent to the server using a PUT request.
     */
    enableUpdate?: `${Endpoint}/:id` extends keyof ApiEndpoints['put'] ? boolean : false;

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
        Omit<ApiEndpoints['get'][Endpoint]['request'], 'sort'>;

    /**
     * The default number of rows that can be displayed per page. Defaults to 50.
     */
    pageSize?: 10 | 25 | 50 | 100;

    /**
     * Default sort that should be applied to the table. May be overridden by the users unless the
     * column definition explicitly disallows sorting.
     */
    sort?: {
        /**
         * Field on which the results should be sorted.
         */
        field: keyof RowModel;

        /**
         * Direction in which the results should be sorted.
         */
        sort: 'asc' | 'desc' | null;
    };

    /**
     * Subject describing what each row in the table is representing. Defaults to "item".
     */
    subject?: string;
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
    const { enableCreate, sort } = props;
    const subject = props.subject ?? 'item';

    const [ error, setError ] = useState<string | undefined>();
    const [ loading, setLoading ] = useState<boolean>(true);

    const [ rowCount, setRowCount ] = useState<number>(0);
    const [ rows, setRows ] = useState<RowModel[]>([ /* no rows */]);

    // ---------------------------------------------------------------------------------------------
    // Capability: (C)reate new rows
    // ---------------------------------------------------------------------------------------------

    const handleCreate = useCallback(async () => {
        setError(undefined);
        try {
            const response = await callApi('post', props.endpoint as any, {
                // TODO: context
            });

            if (response.success) {
                setRowCount(rowCount => rowCount + 1 );
                setRows(rows => [ response.row, ...rows ]);

                // TODO: The new row should be opened in edit mode.

            } else {
                setError(response.error ?? `Unable to create a new ${subject}`);
            }
        } catch (error: any) {
            setError(`Unable to create a new ${subject} (${error.message})`);
        }
    }, [ props.endpoint, subject ]);

    const columns = useMemo(() => {
        if (!enableCreate)
            return props.columns;

        const columns: GridColDef<RowModel>[] = [];
        for (const column of props.columns) {
            if (column.field !== 'id') {
                columns.push(column);
                continue;
            }

            let renderHeader: GridColDef['renderHeader'] = undefined;
            if (enableCreate) {
                renderHeader = () => {
                    return (
                        <Tooltip title={`Create a new ${subject}`}>
                            <IconButton size="small" onClick={handleCreate}>
                                <AddCircleIcon color="success" fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    );
                };
            }

            columns.push({
                ...column,
                renderHeader,
            });
        }

        return columns;

    }, [ enableCreate, handleCreate, props.columns, subject ]);

    // ---------------------------------------------------------------------------------------------
    // Capability: (R)ead existing rows
    // ---------------------------------------------------------------------------------------------

    // TODO: Support `filter`

    const [ paginationModel, setPaginationModel ] = useState<GridPaginationModel>({
        page: 0,
        pageSize: props.pageSize ?? 50,
    });

    const handlePaginationModelChange = useCallback((model: GridPaginationModel) => {
        setPaginationModel(model);
    }, [ /* no deps */ ]);

    const [ sortModel, setSortModel ] =
        useState<GridSortModel | undefined>(sort ? [ sort as GridSortItem ] : undefined);

    const handleSortModelChange = useCallback((model: GridSortModel) => {
        if (!!model.length) {
            setSortModel([
                {
                    field: model[0].field,
                    sort: model[0].sort ?? null,
                }
            ]);
        } else {
            setSortModel(undefined);
        }
    }, [ /* no deps */ ]);

    useEffect(() => {
        setError(undefined);

        // TODO: Remove `as any` when all applicable APIs have been updated to the Data Table API.
        const requestPromise = callApi('get', props.endpoint, {
            // TODO: context
            // TODO: filtering
            pagination: paginationModel,
            ...( sortModel ? { sort: sortModel[0] } : { /* no sort applied */ } ),
        } as any);

        requestPromise
            .then((response: any) => {
                if (response.success) {
                    setRowCount(response.rowCount);
                    setRows(response.rows);
                } else {
                    setError(response.error ?? 'Unable to fetch the information');
                }
            })
            .catch(error => {
                setError(`Unable to fetch the information (${error.message})`)
            })
            .finally(() => setLoading(false));

    }, [ paginationModel, props.endpoint, sortModel ]);

    // ---------------------------------------------------------------------------------------------
    // Capability: (U)pdate existing rows
    // ---------------------------------------------------------------------------------------------

    // TODO

    // ---------------------------------------------------------------------------------------------
    // Capability: (D)elete existing rows
    // ---------------------------------------------------------------------------------------------

    // TODO

    // ---------------------------------------------------------------------------------------------

    return (
        <>
            <Collapse in={!!error}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            </Collapse>
            <DataGrid columns={columns} rows={rows} rowCount={rowCount}

                      pageSizeOptions={[ 10, 25, 50, 100 ]} paginationMode="server"
                      paginationModel={paginationModel}
                      onPaginationModelChange={handlePaginationModelChange}

                      sortingMode="server"
                      sortModel={sortModel} onSortModelChange={handleSortModelChange}

                      autoHeight density="compact" disableColumnMenu hideFooterSelectedRowCount
                      loading={loading} />
        </>
    );
}
