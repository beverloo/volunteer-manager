// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { GridColDef, GridPaginationModel, GridValidRowModel } from '@mui/x-data-grid';
import { DataGrid, GridToolbarQuickFilter  } from '@mui/x-data-grid';

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
 * Type describing a column definition in the DataTable API.
 */
export type DataTableColumn<RowModel extends GridValidRowModel> = GridColDef<RowModel>;

/**
 * Props accepted by the <RemoteDataTable> component.
 */
interface DataTableProps<RowModel extends GridValidRowModel> {
    /**
     * Columns accepted by the data table.
     */
    columns: DataTableColumn<RowModel>[];

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
     * Whether the quick search filter should be enabled. Overrides the <ctrl>+<f> keyboard search
     * shortcut as well to draw focus to the field.
     */
    enableFilter?: boolean;

    /**
     * Whether the footer should be removed. Optional.
     */
    disableFooter?: boolean;

    /**
     * The default number of rows that can be displayed per page. Defaults to 50.
     */
    pageSize?: 10 | 25 | 50 | 100;

    /**
     * The rows that should be displayed in the <DataTable>.
     */
    rows: RowModel[];
}

/**
 * The <DataTable> component is an implementation of the MUI-X DataGrid component
 */
export function DataTable<RowModel extends GridValidRowModel = GridValidRowModel>(
    props: DataTableProps<RowModel>)
{
    const [ paginationModel, setPaginationModel ] = useState<GridPaginationModel>({
        pageSize: props.pageSize ?? 50,
        page: 0,
    });

    const onPaginationModelChange = useCallback((model: GridPaginationModel) => {
        setPaginationModel(model);
    }, [ /* no deps */ ]);

    return (
        <DataGrid rows={props.rows} columns={props.columns}

                  pageSizeOptions={[ 10, 25, 50, 100 ]}
                  paginationModel={paginationModel}
                  onPaginationModelChange={onPaginationModelChange}

                  slots={{ toolbar: !!props.enableFilter ? DataTableFilter : undefined }}

                  autoHeight density="compact" disableColumnMenu hideFooterSelectedRowCount
                  hideFooter={!!props.disableFooter} />
    );
}
