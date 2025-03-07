// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { GridColDef, GridFilterModel, GridPaginationModel, GridValidRowModel } from '@mui/x-data-grid-pro';
import { DataGridPro, GridToolbarQuickFilter, type DataGridProProps } from '@mui/x-data-grid-pro';

import type { SxProps } from '@mui/system';
import type { Theme } from '@mui/material/styles';
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
    const inputReference = useRef<HTMLInputElement>(null);

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
                                    slotProps={{ input: { inputRef: inputReference } }} />
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
     * Whether the footer should be removed. Optional.
     */
    disableFooter?: boolean;

    /**
     * Whether the column filter menu should be enabled.
     */
    enableColumnMenu?: boolean;

    /**
     * Whether the quick search filter should be enabled. Overrides the <ctrl>+<f> keyboard search
     * shortcut as well to draw focus to the field.
     */
    enableFilter?: boolean;

    /**
     * Fields that should be hidden by default. Remember to enable `enableColumnMenu` so that the
     * user is able to enable them again manually.
     */
    hiddenFields?: (keyof RowModel)[];

    /**
     * Initial filters that should be applied to the column.
     */
    initialFilters?: GridFilterModel;

    /**
     * The default number of rows that can be displayed per page. Defaults to 50.
     */
    pageSize?: 10 | 25 | 50 | 100;

    /**
     * The rows that should be displayed in the <DataTable>.
     */
    rows: RowModel[];

    /**
     * Called when column visibility has changed.
     */
    onColumnVisibilityModelChange?: DataGridProProps['onColumnVisibilityModelChange'];

    /**
     * Called when the filter model has changed.
     */
    onFilterModelChange?: DataGridProProps['onFilterModelChange'];
}

/**
 * The <DataTable> component is an implementation of the MUI-X DataGrid component that is immutable,
 * and requires all data to be known at time of component display.
 *
 * In most cases using the <RemoteDataTable> is preferrable as it maintains a cleaner separation
 * between data and presentation. However, in cases where powerful filtering capabilities are needed
 * the <DataTable> component offers the ability to filter and search its content, out-of-the-box
 * ordering, and additional columns that can be shown by the user.
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

    const columnVisibilityModel = useMemo(() => {
        if (!props.hiddenFields || !props.hiddenFields.length)
            return undefined;

        // Transforms an array of strings to an object where each of those strings is a key, with
        // the hardcoded boolean `false` as its value.
        return Object.fromEntries(Object.values(props.hiddenFields).map(key => ([ key, false ])));

    }, [ props.hiddenFields ]);

    return (
        <DataGridPro rows={props.rows} columns={props.columns}

                     pageSizeOptions={[ 10, 25, 50, 100 ]}
                     paginationModel={paginationModel} pagination
                     onPaginationModelChange={onPaginationModelChange}

                     slots={{ toolbar: !!props.enableFilter ? DataTableFilter : undefined }}

                     onColumnVisibilityModelChange={props.onColumnVisibilityModelChange}
                     onFilterModelChange={props.onFilterModelChange}
                     initialState={{
                         columns: { columnVisibilityModel },
                         filter: { filterModel: props.initialFilters },
                         density: 'compact' }}

                     autoHeight disableColumnMenu={!props.enableColumnMenu}
                     hideFooterSelectedRowCount hideFooter={!!props.disableFooter} />
    );
}
