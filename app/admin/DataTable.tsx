// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';

import type { GridColDef, GridRowsProp, GridValidRowModel } from '@mui/x-data-grid';
import type { GridRenderCellParams } from '@mui/x-data-grid';
import { DataGrid, GridToolbarQuickFilter } from '@mui/x-data-grid';

import type { SxProps, Theme } from '@mui/system';
import { default as MuiLink } from '@mui/material/Link';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import ReadMoreIcon from '@mui/icons-material/ReadMore';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';

import { type Environment, kEnvironmentColours } from '@app/Environment';

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
 * Definition for a client transform handler that can be applied to the <DataTable> component.
 */
type ClientTransformHandler = (params: GridRenderCellParams) => React.ReactNode;

/**
 * Icons that can be made available in <DataTable> cells that use the `button` client transform.
 * Included in the TypeScript definition as an enumeration.
 */
const kButtonClientTransformIcons = {
    'read-more': () => <ReadMoreIcon color="info" />,
} as const;

/**
 * Client transform that expects each value to be a URL. The icon will be provided through the
 * volumn definition, which is expected to be a key of `kButtonClientTransformIcons`.
 */
const ButtonClientTransform: ClientTransformHandler = (params: GridRenderCellParams) => {
    const { clientTransform } = params.colDef as any;
    const icon = clientTransform.icon as keyof typeof kButtonClientTransformIcons | undefined;

    return (
        <MuiLink component={Link} href={params.value} sx={{ pt: '4px' }}>
            { (kButtonClientTransformIcons[icon ?? 'read-more'])() }
        </MuiLink>
    );
};

/**
 * Client transform that takes a comma-separated list of team names, each of which will be drawn in
 * a separate <Chip> component.
 *
 * @todo Give the <Chip> components a distinctive colour depending on the team.
 */
const TeamsClientTransform: ClientTransformHandler = (params: GridRenderCellParams) => {
    const kTeamEnvironmentMapping: { [k: string]: Environment } = {
        Crew: 'gophers.team',
        Hosts: 'hosts.team',
        Stewards: 'stewards.team',
    };

    const chips = params.value?.split(',');
    const theme = useTheme();

    if (Array.isArray(chips) && chips.length > 0) {
        return (
            <Stack direction="row" spacing={1}>
                { chips.map((chip: any, index: any) => {
                    const environment = kTeamEnvironmentMapping[chip] || 'animecon.team';
                    const colour = kEnvironmentColours[environment][theme.palette.mode];

                    return (
                        <Chip size="small"
                              color="primary" variant="outlined"
                              key={index} label={chip}
                              sx={{ borderWidth: 0, backgroundColor: colour, color: 'white' }} />
                    );
                }) }
            </Stack>
        );
    }
};

/**
 * The client transform types that are known to the <DataTable> component. Each is defined using a
 * rendering function that overrides the default rendering of the cell.
 */
const kClientTransformMap = {
    button: ButtonClientTransform,
    teams: TeamsClientTransform,
} as const;

/**
 * Component that displays a quick filter at the top of the <DataTable> component. The user can type
 * whatever they're searching for in this filter, which will automatically search through all data.
 */
function DataTableFilter() {
    return (
        <Box sx={kStyles.filterContainer}>
            <GridToolbarQuickFilter debounceMs={200} fullWidth sx={kStyles.filterTextField} />
        </Box>
    )
}

/**
 * Additional properties that can be made available to the `DataTableColumn` type for behaviour
 * specific to the <DataTable> component.
 */
interface DataTableColumnClientTransform {
    /**
     * Client transforms are mechanisms that dynamically transform the original data on the client-
     * side. This allows IDs to be replaced with linkable icons, among other transformations, which
     * are not possible to do server-side due to the nature of MUI's <DataGrid> type.
     */
    clientTransform?: {
        /**
         * Type of client transform that should be provided.
         */
        type: keyof typeof kClientTransformMap,

        /**
         * Icon to apply to the client transform. Only considered for `type` = `button`.
         */
        icon?: keyof typeof kButtonClientTransformIcons,
    },
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
     * Whether the data table should have a quick filter rendered above it.
     */
    enableFilter?: boolean;

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
    const { dense, enableFilter, rows } = props;

    const columns = props.columns.map(column => {
        const { clientTransform } = column;
        return clientTransform
            ? { ...column, renderCell: kClientTransformMap[clientTransform.type] }
            : column;
    });

    return (
        <DataGrid rows={rows} columns={columns} autoHeight
                  disableColumnMenu hideFooterSelectedRowCount
                  density={ dense ? 'compact' : 'standard' }
                  initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
                  pageSizeOptions={ [ 25, 50, 100 ] }
                  slots={{ toolbar: !!enableFilter ? DataTableFilter : undefined }} />
    );
}
