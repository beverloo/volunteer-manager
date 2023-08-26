// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';

import type { GridRenderCellParams } from '@mui/x-data-grid';
import { default as MuiLink } from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import ReadMoreIcon from '@mui/icons-material/ReadMore';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { type DataTableColumn, DataTable } from '@app/admin/DataTable';
import type { NextRouterParams } from '@lib/NextRouterParams';
import { RoleBadge } from '@app/lib/database/Types';
import { VolunteerBadge } from '@app/components/VolunteerBadge';

/**
 * Formats the given number of `milliseconds` to a HH:MM string.
 */
function formatMilliseconds(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor(seconds / 60) - hours * 60;

    return minutes ? `${hours}:${('00'+minutes).substr(-2)}`
                   : `${hours}`;
}

/**
 * Props accepted by the <VolunteerTable> component.
 */
export interface VolunteerTableProps extends NextRouterParams<'slug' | 'team'> {
    /**
     * Title that should be given to this page.
     */
    title: string;

    /**
     * Information about the volunteers that should be displayed in the table. Transformations will
     * be used to add interaction to the <DataTable>.
     */
    volunteers: {
        id: number;
        name: string;
        role: string;
        roleBadge?: RoleBadge;
        shiftCount: number;
        shiftMilliseconds?: number;
        status?: string;  // <-- todo
    }[];
}

/**
 * The <VolunteerTable> table displays an overview of all volunteers who have signed up to help out
 * in the current event, in the current team. Each volunteer will receive a detailed page.
 */
export function VolunteerTable(props: VolunteerTableProps) {
    const kVolunteerBase = `/admin/events/${props.params.slug}/${props.params.team}/volunteers/`;

    const columns: DataTableColumn[] = [
        {
            field: 'id',
            headerName: '',
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
                if (!params.row.roleBadge)
                    return params.value;

                return (
                    <>
                        {params.value}
                        <Tooltip title={params.row.role}>
                            <VolunteerBadge variant={params.row.roleBadge} color="error"
                                            fontSize="small" sx={{ pl: .5 }} />
                        </Tooltip>
                    </>
                );
            },
        },
        {
            field: 'role',
            headerName: 'Role',
            sortable: true,
            flex: 1,
        },
        {
            field: 'shiftCount',
            headerName: 'Shifts',
            sortable: true,
            width: 200,

            renderCell: (params: GridRenderCellParams) =>
                <>
                    {params.value}
                    {params.row.shiftMilliseconds &&
                        <Typography variant="body2" sx={{ pl: 0.5, color: 'action.active' }}>
                            ({formatMilliseconds(params.row.shiftMilliseconds)} hours)
                        </Typography> }
                </>,
        },
        {
            field: 'status',
            headerName: 'Status',
            sortable: true,
            flex: 1,

            // TODO: Display status icons for registration status (hotel etc.)
            renderCell: (params: GridRenderCellParams) => '…',
        }
    ];

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ pb: 1 }}>
                {props.title} ({props.volunteers.length} people)
            </Typography>
            <DataTable columns={columns} rows={props.volunteers}
                       pageSize={props.volunteers.length}
                       disableFooter enableFilter />
        </Paper>
    )
}
