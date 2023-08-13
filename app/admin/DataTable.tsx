// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { DataGrid, GridRowModes, GridToolbarQuickFilter } from '@mui/x-data-grid';
import type {
    GridRenderCellParams, GridColDef, GridFeatureMode, GridPaginationModel, GridRowsProp,
    GridValidRowModel, GridColumnHeaderParams, GridRowModesModel } from '@mui/x-data-grid';

import type { SxProps, Theme } from '@mui/system';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Box from '@mui/material/Box';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';

/**
 * Custom styles applied to the <DataTable> & related components.
 */
const kStyles: { [key: string]: SxProps<Theme> } = {
    filterContainer: {
        p: 1,

        backgroundColor: theme => theme.palette.mode === 'light' ? 'grey.200'
                                                                 : 'grey.800',
    },
    filterTextField: {
        width: '100%',
        pb: 0,

        '& .MuiInputBase-adornedEnd > .MuiSvgIcon-root': {
            color: 'action.active',
        },

        '& .MuiInput-underline:before': {
            borderBottomWidth: 0,
        },
    },
};

/**
 * Component that displays a quick filter at the top of the <DataTable> component. The user can type
 * whatever they're searching for in this filter, which will automatically search through all data.
 */
function DataTableFilter() {
    const inputReference = useRef<HTMLInputElement>();

    useEffect(() => {
        function handleKeyPress(event: KeyboardEvent) {
            if (!inputReference.current)
                return;

            if (event.keyCode !== 114 && !(event.ctrlKey && event.keyCode === 70))
                return;

            event.preventDefault();
            inputReference.current.focus();
        }

        document.addEventListener('keydown', handleKeyPress);
        return () => document.removeEventListener('keydown', handleKeyPress);
    });

    return (
        <Box sx={kStyles.filterContainer}>
            <GridToolbarQuickFilter debounceMs={200} fullWidth sx={kStyles.filterTextField}
                                    InputProps={{ inputRef: inputReference }} />
        </Box>
    )
}

/**
 * Type definition for a column displayed in the <DataTable> component.
 */
export type DataTableColumn<RowModel extends GridValidRowModel = GridValidRowModel>
    = GridColDef<RowModel>;

/**
 * Base properties accepted by the <DataTable> component, excluding input data.
 */
export interface DataTableBaseProps<RowModel extends GridValidRowModel = GridValidRowModel> {
    /**
     * Callback to be called when a new row has been added. Inclusion of such a callback will
     * automatically activate the row addition UI in the <DataTable> component.
     */
    commitAdd?: () => Promise<RowModel>;

    /**
     * Callback to be called when a row should be deleted. The user has already acknowledged a
     * confirmation prompt by the time this happens.
     */
    commitDelete?: (oldRow: RowModel) => Promise<void>;

    /**
     * Callback to be called when a row-level edit has completed and it should be committed. Failure
     * can be communicated by rejecting the promise.
     */
    commitEdit?: (newRow: RowModel, oldRow: RowModel) => Promise<RowModel>;

    /**
     * Whether the table should be displayed in a dense manner. Defaults to comfortable display.
     */
    dense?: boolean;

    /**
     * Whether the data table's footer should be disabled.
     */
    disableFooter?: boolean;

    /**
     * Whether the data table should have a quick filter rendered above it.
     */
    enableFilter?: boolean;

    /**
     * Subject of the data when included in messages. Defaults to "entry".
     */
    messageSubject?: string;

    /**
     * Number of log items to display per page. Defaults to 25.
     */
    pageSize?: number;

    /**
     * Options that can be selected for page sizes. Defaults to [ 25, 50, 100 ].
     */
    pageSizeOptions?: number[];
}

/**
 * The request information shared with a remote source when new information is required.
 */
export interface DataTableRowRequest extends GridPaginationModel {}

/**
 * The response that has to be shared with the <DataTable> implementation when a remote data source
 * is used.
 */
export interface DataTableRowResponse<RowModel extends GridValidRowModel = GridValidRowModel> {
    /**
     * The total number of rows that are available on the remote source.
     */
    rowCount: number;

    /**
     * The rows that were fetched from the remote source.
     */
    rows: RowModel[];
}

/**
 * Data definition for <DataTable> users where the data is made locally available.
 */
type DataTableLocalData<RowModel extends GridValidRowModel> = {
    /**
     * The rows that should be displayed in the data table. TypeScript will validate these against
     * the given column model.
     */
    rows: GridRowsProp<RowModel>;
};

/**
 * Data definition for <DataTable> users where the data should be fetched from an API.
 */
type DataTableRemoteData<RowModel extends GridValidRowModel> = {
    /**
     * URL to the source API through which row data can be fetched. The MUI <DataGrid> component
     * will automatically load data based on the available data.
     */
    onRequestRows: (request: DataTableRowRequest) => Promise<DataTableRowResponse<RowModel>>;
};

/**
 * Props accepted by the <DataTable> component.
 */
export type DataTableProps<RowModel extends GridValidRowModel = GridValidRowModel> =
    DataTableBaseProps<RowModel> & (DataTableLocalData<RowModel> | DataTableRemoteData<RowModel>) &
{
    /**
     * Columns that should be shown in the data table.
     */
    columns: DataTableColumn<RowModel>[];
}

/**
 * The <DataTable> component is a wrapper around the MUI <DataGrid> component with consistent
 * defaults across the Volunteer Manager. It provides a simpler model to access the behaviour while
 * maintaining the key strenghts of the DataGrid.
 */
export function DataTable<RowModel extends GridValidRowModel>(props: DataTableProps<RowModel>) {
    const { commitAdd, commitDelete, commitEdit } = props;
    const { dense, disableFooter, enableFilter } = props;

    const [ loading, setLoading ] = useState(false);

    const [ rows, setRows ] = useState('rows' in props ? props.rows : [ /* remote data */ ]);
    const [ rowModesModel, setRowModesModel ] = useState<GridRowModesModel>({ });

    const messageSubject = props.messageSubject ?? 'entry';
    const pageSize = props.pageSize ?? 25;
    const pageSizeOptions = props.pageSizeOptions ?? [ 25, 50, 100 ];

    // ---------------------------------------------------------------------------------------------
    // Deletion functionality
    // ---------------------------------------------------------------------------------------------

    const [ deleteCandidate, setDeleteCandidate ] = useState<RowModel>();
    const [ deleteLoading, setDeleteLoading ] = useState(false);

    const doAdd = useCallback(async () => {
        if (!commitAdd)
            return;

        setLoading(true);
        try {
            const focusField = props.columns.length > 1 ? props.columns[1].field : undefined;
            const newRow = await commitAdd();

            setRows(oldRows => [ newRow, ...oldRows ]);
            setRowModesModel(oldModel => ({
                ...oldModel,
                [newRow.id]: {
                    fieldToFocus: focusField,
                    mode: GridRowModes.Edit,
                }
            }));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [ commitAdd, props.columns, setLoading, setRows, setRowModesModel ]);

    const doDelete = useCallback(async () => {
        if (!commitDelete || !deleteCandidate)
            return;

        setDeleteLoading(true);
        try {
            const candidateId = deleteCandidate.id;
            await commitDelete(deleteCandidate);

            setDeleteCandidate(undefined);
            setRows(oldRows => oldRows.filter(row => row.id !== candidateId));
        } catch (error) {
            console.error(error);
        } finally {
            setDeleteLoading(false);
        }
    }, [ commitDelete, deleteCandidate, setDeleteCandidate, setDeleteLoading ]);

    const doEdit = useCallback(async (newRow: RowModel, oldRow: RowModel) => {
        if (!commitEdit)
            return oldRow;

        setLoading(true);
        try {
            return await commitEdit(newRow, oldRow);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }

        return oldRow;  // failure condition

    }, [ commitEdit, setLoading ]);

    // Automatically translate the columns included in the data table to include a delete button
    // when `columnDelete` is specified. A confirmation message will be provided by <DataTable />.
    const columns =
        (!commitDelete && !commitAdd)
            ? props.columns
            : props.columns.map(column => {
                if (column.field !== 'id')
                    return column;

                let renderCell: GridColDef['renderCell'] = undefined;
                if (commitDelete) {
                    renderCell = (params: GridRenderCellParams) => {
                        return (
                            <IconButton size="small"
                                        onClick={ () => setDeleteCandidate(params.row) }>
                                <DeleteForeverIcon color="error" fontSize="small" />
                            </IconButton>
                        );
                    };
                }

                let renderHeader: GridColDef['renderHeader'] = undefined;
                if (commitAdd) {
                    renderHeader = (params: GridColumnHeaderParams) => {
                        return (
                            <IconButton size="small" onClick={doAdd}>
                                <AddCircleIcon color="success" fontSize="small" />
                            </IconButton>
                        );
                    };
                }

                return {
                    ...column,
                    renderCell,
                    renderHeader,
                }
            });

    // ---------------------------------------------------------------------------------------------
    // Server-side data fetching functionality
    // ---------------------------------------------------------------------------------------------

    // Determine whether the <DataTable> will use local data, or will talk to an API endpoint in
    // order to fetch the necessary data from a remote source.
    const featureMode: GridFeatureMode = 'rows' in props ? 'client' : 'server';
    const onRequestRows = 'onRequestRows' in props ? props.onRequestRows : undefined;

    const [ rowCount, setRowCount ] = useState('rows' in props ? props.rows.length : 0);

    const [ paginationModel, setPaginationModel ] = useState<GridPaginationModel>({
        page: 0, pageSize,
    });

    // Effect to actually load the necessary data from the server. Only applicable for server-based
    // data sources, it's a no-op for client-side data sources.
    useEffect(() => {
        if (featureMode !== 'server' || !onRequestRows)
            return;

        setLoading(true);
        onRequestRows({
            ...paginationModel,
        }).then(response => {
            setLoading(false);
            setRowCount(response.rowCount);
            setRows(response.rows);
        });

    }, [ featureMode, paginationModel, onRequestRows ])

    // ---------------------------------------------------------------------------------------------

    return (
        <>
            <DataGrid rows={rows} columns={columns} loading={loading} autoHeight
                    rowCount={rowCount} paginationMode={featureMode}
                    paginationModel={ featureMode === 'server' ? paginationModel : undefined }
                    onPaginationModelChange={
                        featureMode === 'server' ? setPaginationModel : undefined }
                    disableColumnMenu hideFooterSelectedRowCount hideFooter={!!disableFooter}
                    density={ dense ? 'compact' : 'standard' }
                    editMode={ commitEdit ? 'row' : undefined } processRowUpdate={doEdit}
                    initialState={{ pagination: { paginationModel: { pageSize } } }}
                    pageSizeOptions={ pageSizeOptions }
                    onRowModesModelChange={setRowModesModel} rowModesModel={ rowModesModel }
                    slots={{ toolbar: !!enableFilter ? DataTableFilter : undefined }} />
            <Dialog open={!!deleteCandidate} onClose={ () => setDeleteCandidate(undefined) }>
                <DialogTitle>
                    Delete this {messageSubject}?
                </DialogTitle>
                <DialogContent>
                    Are you sure that you want to remove this {messageSubject}? This action can't
                    be undone once you confirm its deletion. you confirm its deletion.
                </DialogContent>
                <DialogActions sx={{ p: 2, pt: 0 }}>
                    <Button onClick={ () => setDeleteCandidate(undefined) }>Cancel</Button>
                    <LoadingButton onClick={doDelete} loading={deleteLoading} variant="contained">
                        Delete
                    </LoadingButton>
                </DialogActions>
            </Dialog>
        </>
    );
}
