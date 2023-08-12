// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useEffect, useRef } from 'react';

import type { GridColDef, GridRowsProp, GridValidRowModel } from '@mui/x-data-grid';
import { DataGrid, GridToolbarQuickFilter } from '@mui/x-data-grid';

import type { SxProps, Theme } from '@mui/system';
import Box from '@mui/material/Box';

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
export interface DataTableBaseProps {
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
}

/**
 * Props accepted by the <DataTable> component.
 */
export type DataTableProps<RowModel extends GridValidRowModel = GridValidRowModel> =
        DataTableBaseProps & {
    /**
     * Columns that should be shown in the data table.
     */
    columns: DataTableColumn<RowModel>[];

    /**
     * The rows that should be displayed in the data table. TypeScript will validate these against
     * the given column model.
     */
    rows: GridRowsProp<RowModel>;
}

/**
 * The <DataTable> component is a wrapper around the MUI <DataGrid> component with consistent
 * defaults across the Volunteer Manager. It provides a simpler model to access the behaviour while
 * maintaining the key strenghts of the DataGrid.
 */
export function DataTable<RowModel extends GridValidRowModel>(props: DataTableProps<RowModel>) {
    const { columns, dense, disableFooter, enableFilter, rows } = props;

    return (
        <DataGrid rows={rows} columns={columns} autoHeight
                  disableColumnMenu hideFooterSelectedRowCount hideFooter={!!disableFooter}
                  density={ dense ? 'compact' : 'standard' }
                  initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
                  pageSizeOptions={ [ 25, 50, 100 ] }
                  slots={{ toolbar: !!enableFilter ? DataTableFilter : undefined }} />
    );
}
