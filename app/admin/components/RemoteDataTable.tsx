// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { GridColDef, GridPaginationModel, GridRenderCellParams, GridRowModesModel,
    GridSortItem, GridSortModel, GridValidRowModel } from '@mui/x-data-grid';
import { DataGrid, GridRowModes } from '@mui/x-data-grid';

import AddCircleIcon from '@mui/icons-material/AddCircle';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import Tooltip from '@mui/material/Tooltip';

import { type ApiEndpoints, callApi } from '@lib/callApi';

/**
 * Type describing a column definition in the DataTable API.
 */
export type RemoteDataTableColumn<RowModel extends GridValidRowModel> = GridColDef<RowModel>;

/**
 * Context expected by the remote data table. Automatically inferred based on the endpoint. No
 * context must be passed when the endpoint does not expect any.
 */
type RemoteDataTableContext<Endpoint extends keyof ApiEndpoints['get']> =
    ApiEndpoints['get'][Endpoint]['request'] extends { context: unknown }
        ? { context: ApiEndpoints['get'][Endpoint]['request']['context'] }
        : { /* no context is assumed */ };

/**
 * Props accepted by the <RemoteDataTable> component.
 */
type RemoteDataTableProps<Endpoint extends keyof ApiEndpoints['get'],
                          RowModel extends GridValidRowModel> = RemoteDataTableContext<Endpoint> & {
    /**
     * Columns accepted by the data table.
     */
    columns: RemoteDataTableColumn<RowModel>[];

    /**
     * Default sort that should be applied to the table. May be overridden by the users unless the
     * column definition explicitly disallows sorting.
     */
    defaultSort: {
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
     * Whether new rows can be deleted. When set, this will display a _create_ icon in the header
     * of the first column. Creation will send a POST request to the server.
     */
    enableCreate?: Endpoint extends keyof ApiEndpoints['post'] ? boolean : false;

    /**
     * Whether rows can be deleted. When set, this will display a _delete_ icon as the first column
     * of every row. Deletion will only happen after the user confirms the operation.
     *
     * When a `protected` field is included in the `RowModel`, it will be checked for truthiness to
     * determine whether individual rows should be excluded from being removed.
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
     * The default number of rows that can be displayed per page. Defaults to 50.
     */
    pageSize?: 10 | 25 | 50 | 100;

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
    const { enableCreate, enableDelete, enableUpdate } = props;

    const subject = props.subject ?? 'item';
    const context = useMemo(() =>
        'context' in props ? { context: props.context } : { /* no context */}, [ props ]);

    const [ error, setError ] = useState<string | undefined>();
    const [ loading, setLoading ] = useState<boolean>(true);

    const [ rowCount, setRowCount ] = useState<number>(0);
    const [ rowModesModel, setRowModesModel ] = useState<GridRowModesModel>({ });
    const [ rows, setRows ] = useState<RowModel[]>([ /* no rows */]);

    const [ deleteCandidate, setDeleteCandidate ] = useState<number | undefined>();
    const [ deleteLoading, setDeleteLoading ] = useState<boolean>(false);

    // ---------------------------------------------------------------------------------------------
    // Capability: (C)reate new rows
    // ---------------------------------------------------------------------------------------------

    const handleCreate = useCallback(async () => {
        setError(undefined);
        try {
            if (!enableCreate)
                throw new Error('create actions are not supported for this type');

            const response = await callApi('post', props.endpoint as any, {
                ...context,
                row: { /* no default fields */ },
            });

            if (response.success) {
                const focusField = props.columns.length > 1 ? props.columns[1].field : undefined;

                setRowCount(rowCount => rowCount + 1 );
                setRows(rows => [ response.row, ...rows ]);

                setRowModesModel(model => ({
                    ...model,
                    [response.row.id]: {
                        fieldToFocus: focusField,
                        mode: GridRowModes.Edit,
                    }
                }));

            } else {
                setError(response.error ?? `Unable to create a new ${subject}`);
            }
        } catch (error: any) {
            setError(`Unable to create a new ${subject} (${error.message})`);
        }
    }, [ context, enableCreate, props.columns, props.endpoint, subject ]);

    const columns = useMemo(() => {
        if (!enableCreate && !enableDelete)
            return props.columns;

        const columns: GridColDef<RowModel>[] = [];
        for (const column of props.columns) {
            if (column.field !== 'id') {
                columns.push(column);
                continue;
            }

            let renderCell: GridColDef['renderCell'] = undefined;
            if (enableDelete) {
                renderCell = (params: GridRenderCellParams) => {
                    if (!!params.row.protected) {
                        return (
                            <Tooltip title={`This ${subject} cannot be deleted`}>
                                <DeleteForeverIcon color="disabled" fontSize="small"
                                                   sx={{ ml: '5px' }} />
                            </Tooltip>
                        );
                    }

                    return (
                        <Tooltip title={`Delete this ${subject}`}>
                            <IconButton onClick={ () => setDeleteCandidate(params.row.id) }
                                        size="small">
                                <DeleteForeverIcon color="error" fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    );
                };
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
                renderCell,
                renderHeader,
            });
        }

        return columns;

    }, [ enableCreate, handleCreate, enableDelete, props.columns, subject ]);

    // ---------------------------------------------------------------------------------------------
    // Capability: (R)ead existing rows
    // ---------------------------------------------------------------------------------------------

    const [ paginationModel, setPaginationModel ] = useState<GridPaginationModel>({
        page: 0,
        pageSize: props.pageSize ?? 50,
    });

    const handlePaginationModelChange = useCallback((model: GridPaginationModel) => {
        setPaginationModel(model);
    }, [ /* no deps */ ]);

    const [ sortModel, setSortModel ] =
        useState<GridSortModel>([ props.defaultSort as GridSortItem ]);

    const handleSortModelChange = useCallback((model: GridSortModel) => {
        if (!!model.length) {
            setSortModel([
                {
                    field: model[0].field,
                    sort: model[0].sort ?? null,
                }
            ]);
        } else {
            setSortModel([ props.defaultSort as GridSortItem ]);
        }
    }, [ props.defaultSort ]);

    useEffect(() => {
        setError(undefined);

        // TODO: Remove `as any` when all applicable APIs have been updated to the Data Table API.
        const requestPromise = callApi('get', props.endpoint, {
            ...context,
            pagination: paginationModel,
            sort: sortModel[0],
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

    }, [ context, paginationModel, props.endpoint, sortModel ]);

    // ---------------------------------------------------------------------------------------------
    // Capability: (U)pdate existing rows
    // ---------------------------------------------------------------------------------------------

    const handleUpdate = useCallback(async (newRow: RowModel, oldRow: RowModel) => {
        setError(undefined);
        try {
            if (!enableUpdate)
                throw new Error('updates actions are not supported for this type');

            const response = await callApi('put', `${props.endpoint}/:id` as any, {
                id: newRow.id,
                ...context,
                row: newRow,
            });

            if (response.success)
                return newRow;

            setError(response.error ?? `Unable to update a ${subject}`);
            return oldRow;

        } catch (error: any) {
            setError(`Unable to update a ${subject} (${error.message})`);
            return oldRow;
        }
    }, [ context, enableUpdate, props.endpoint, subject ]);

    // ---------------------------------------------------------------------------------------------
    // Capability: (D)elete existing rows
    // ---------------------------------------------------------------------------------------------

    const handleDelete = useCallback(async () => {
        setDeleteLoading(true);
        setError(undefined);
        try {
            if (!enableDelete)
                throw new Error('deleting actions are not supported for this type');

            if (!deleteCandidate)
                throw new Error('lost context of the delete candidate');

            const response = await callApi('delete', `${props.endpoint}/:id` as any, {
                id: deleteCandidate,
                ...context,
            });

            if (response.success) {
                setRows(oldRows => oldRows.filter(row => row.id !== deleteCandidate));
            } else {
                setError(response.error ?? `Unable to delete a ${subject}`);
            }
        } catch (error: any) {
            setError(`Unable to delete a ${subject} (${error.message})`);
        } finally {
            setDeleteCandidate(undefined);
            setDeleteLoading(false);
        }
    }, [ context, deleteCandidate, enableDelete, props.endpoint, subject ]);

    const resetDeleteCandidate = useCallback(() => setDeleteCandidate(undefined), []);

    // ---------------------------------------------------------------------------------------------

    return (
        <>
            <Collapse in={!!error}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            </Collapse>

            <DataGrid columns={columns} rows={rows} rowCount={rowCount}
                      rowModesModel={rowModesModel} onRowModesModelChange={setRowModesModel}
                      processRowUpdate={handleUpdate}

                      pageSizeOptions={[ 10, 25, 50, 100 ]} paginationMode="server"
                      paginationModel={paginationModel}
                      onPaginationModelChange={handlePaginationModelChange}

                      sortingMode="server"
                      sortModel={sortModel} onSortModelChange={handleSortModelChange}

                      autoHeight density="compact" disableColumnMenu hideFooterSelectedRowCount
                      loading={loading} />

            <Dialog open={!!deleteCandidate} onClose={resetDeleteCandidate}>
                <DialogTitle>
                    Delete this {subject}?
                </DialogTitle>
                <DialogContent>
                    Are you sure that you want to remove this {subject}? This action can't be
                    undone once you confirm its deletion.
                </DialogContent>
                <DialogActions sx={{ p: 2, pt: 0 }}>
                    <Button onClick={resetDeleteCandidate}>Cancel</Button>
                    <LoadingButton onClick={handleDelete} loading={deleteLoading}
                                   variant="contained">
                        Delete
                    </LoadingButton>
                </DialogActions>
            </Dialog>
        </>
    );
}
