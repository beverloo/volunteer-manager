// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';
import { useMemo } from 'react';

import type { GridRenderCellParams } from '@mui/x-data-grid';
import { default as MuiLink } from '@mui/material/Link';
import LocalPoliceIcon from '@mui/icons-material/LocalPolice';
import ReadMoreIcon from '@mui/icons-material/ReadMore';
import ReportGmailerrorredIcon from '@mui/icons-material/ReportGmailerrorred';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';

import type { DataTableBaseProps, DataTableColumn } from '@app/admin/DataTable';
import { DataTable } from '@app/admin/DataTable';
import { TeamChip } from './TeamChip';

/**
 * Props accepted by the <VolunteerDataTable> component.
 */
export type VolunteerDataTableProps = DataTableBaseProps & {
    /**
     * Information about the teams and their theme colours.
     */
    teamColours: {
        name: string;
        darkThemeColour: string;
        lightThemeColour: string;
    }[];

    /**
     * The data that should be shown in the volunteer data table.
     */
    volunteers: {
        id: number;
        username?: string;
        name: string;
        teams?: string;
        activated: boolean;
        admin: boolean;
    }[];
}

/**
 * The <VolunteerDataTable> component wraps the <DataTable> component with a few added client
 * transformation options specific to this functionality.
 */
export function VolunteerDataTable(props: VolunteerDataTableProps) {
    const kVolunteerBase = '/admin/volunteers/';

    const teamColours = useMemo(() => {
        return new Map(props.teamColours.map(({ name, darkThemeColour, lightThemeColour }) =>
            ([ name, { dark: darkThemeColour, light: lightThemeColour } ])));

    }, [ props.teamColours ]);

    const columns: DataTableColumn[] = [
        {
            field: 'id',
            headerName: /* empty= */ '',
            sortable: false,
            width: 50,

            renderCell: (params: GridRenderCellParams) =>
                <MuiLink component={Link} href={kVolunteerBase + params.value} sx={{ pt: '4px' }}>
                    <ReadMoreIcon color="info" />
                </MuiLink>,
        },
        {
            field: 'name',
            headerName: 'Name',
            sortable: true,
            flex: 1,

            renderCell: (params: GridRenderCellParams) => {
                if (params.row.activated && !params.row.admin)
                    return params.value;

                return (
                    <>
                        {params.value}

                        { !!params.row.admin &&
                            <Tooltip title="Administrator">
                                <LocalPoliceIcon color="success" fontSize="small" sx={{ ml: 1 }} />
                            </Tooltip> }

                        { !params.row.activated &&
                            <Tooltip title="Pending activation">
                                <ReportGmailerrorredIcon color="error" fontSize="small"
                                                         sx={{ ml: 1 }} />
                            </Tooltip>
                        }
                    </>
                );
            },
        },
        {
            field: 'username',
            headerName: 'E-mail',
            sortable: true,
            flex: 1,
        },
        {
            field: 'teams',
            headerName: 'Teams',
            sortable: false,
            flex: 1,

            renderCell: (params: GridRenderCellParams) => {
                const chips = params.value?.split(',').sort();
                if (!Array.isArray(chips))
                    return undefined;

                return (
                    <Stack direction="row" spacing={1}>
                        { chips.map((team: any, index: number) =>
                            <TeamChip key={index} label={team}
                                      colours={teamColours.get(team)!} /> ) }
                    </Stack>
                );
            },
        },
    ];

    return <DataTable columns={columns} rows={props.volunteers} {...props} />
}
