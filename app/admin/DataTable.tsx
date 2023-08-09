// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';

import type { GridColDef, GridRowsProp, GridValidRowModel } from '@mui/x-data-grid';
import type { GridRenderCellParams } from '@mui/x-data-grid';
import { DataGrid } from '@mui/x-data-grid/DataGrid';

import { default as MuiLink } from '@mui/material/Link';
import Chip from '@mui/material/Chip';
import ReadMoreIcon from '@mui/icons-material/ReadMore';
import Stack from '@mui/material/Stack';

/**
 * Additional properties that can be made available to the `DataTableColumn` type for behaviour
 * specific to the <DataTable> component.
 */
interface DataTableColumnClientTransform {
    /**
     * Type of client transformation that should happen to the data. Used because data is fetched
     * and formatted in server components.
     */
    clientTransform?: 'button' | 'chips';

    /**
     * Name of the icon to display. (Applicable to clientTransform=button.)
     */
    clientTransformIcon?: 'read-more';

    /**
     * Base URL of where the button should link to. (Applicable to clientTransform=button.)
     */
    clientTransformUrl?: string;
}

/**
 * Type definition for a column displayed in the <DataTable> component.
 */
export type DataTableColumn<RowModel extends GridValidRowModel = GridValidRowModel>
    = GridColDef<RowModel> & DataTableColumnClientTransform;

/**
 * Props accepted by the <DataTable> component.
 */
export interface DataTableProps<RowModel extends GridValidRowModel = GridValidRowModel> {
    /**
     * Columns that should be shown in the data table.
     */
    columns: DataTableColumn<RowModel>[];

    /**
     * Whether the table should be displayed in a dense manner. Defaults to comfortable display.
     */
    dense?: boolean;

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
    const { dense, rows } = props;

    // Transform the columns to apply `clientTransform` when that property has been given.
    const columns = props.columns.map(column => {
        const { clientTransform, clientTransformIcon, clientTransformUrl, ...rest } = column;
        switch (clientTransform) {
            case 'button':
                return {
                    ...rest,
                    renderCell: (params: GridRenderCellParams) => {
                        const icon = clientTransformIcon ?? 'read-more';
                        const href = `${clientTransformUrl ?? './'}${params.value}`;

                        return (
                            <MuiLink component={Link} href={href} sx={{ pt: '4px' }}>
                                { icon === 'read-more' && <ReadMoreIcon color="primary" /> }
                            </MuiLink>
                        );
                    },
                };

            case 'chips': {
                return {
                    ...rest,
                    renderCell: (params: GridRenderCellParams) => {
                        const chips = params.value?.split(',');
                        if (Array.isArray(chips) && chips.length > 0) {
                            return (
                                <Stack direction="row" spacing={1}>
                                    { chips.map((chip: any, index: any) =>
                                        <Chip size="small" color="primary" variant="outlined"
                                              key={index} label={chip} /> ) }
                                </Stack>
                            );
                        }
                    },
                };
            }

            default:
                return rest;
        }
    });

    return (
        <DataGrid rows={rows} columns={columns} autoHeight
                  disableColumnMenu hideFooterSelectedRowCount
                  density={dense ? 'compact' : 'standard'}
                  initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
                  pageSizeOptions={ [ 25, 50, 100 ] } />
    );
}
