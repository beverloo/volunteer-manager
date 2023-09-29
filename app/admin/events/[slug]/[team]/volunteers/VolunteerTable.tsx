// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';
import React from 'react';

import type { GridRenderCellParams } from '@mui/x-data-grid';
import { default as MuiLink } from '@mui/material/Link';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import HistoryToggleOffIcon from '@mui/icons-material/HistoryToggleOff';
import HotelIcon from '@mui/icons-material/Hotel';
import Paper from '@mui/material/Paper';
import ReadMoreIcon from '@mui/icons-material/ReadMore';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { type DataTableColumn, DataTable } from '@app/admin/DataTable';
import type { NextRouterParams } from '@lib/NextRouterParams';
import { RegistrationStatus, RoleBadge } from '@lib/database/Types';
import { VolunteerBadge } from '@components/VolunteerBadge';

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
 * Information associated with
 */
export interface VolunteerInfo {
    id: number;
    date?: Date;
    status: RegistrationStatus;
    name: string;
    role: string;
    roleBadge?: RoleBadge;
    shiftCount: number;
    shiftMilliseconds?: number;

    hotelEligible?: number;
    hotelStatus?: 'available' | 'submitted' | 'skipped' | 'confirmed';

    trainingEligible?: number;
    trainingStatus?: 'available' | 'submitted' | 'skipped' | 'confirmed';
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
    volunteers: VolunteerInfo[];
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
            sortable: false,
            flex: 1,

            renderCell: (params: GridRenderCellParams) => {
                return (
                    <React.Fragment>
                        <MuiLink component={Link} href={kVolunteerBase + params.row.id}>
                            {params.value}
                        </MuiLink>
                        { !!params.row.roleBadge &&
                            <VolunteerBadge variant={params.row.roleBadge} color="error"
                                            fontSize="small" sx={{ pl: .5 }} /> }
                    </React.Fragment>
                );
            },
        },
        {
            field: 'role',
            headerName: 'Role',
            sortable: false,
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
            sortable: false,
            flex: 1,

            // TODO: Display status icons for registration status (hotel etc.)
            renderCell: (params: GridRenderCellParams) => {
                let hotelIcon: React.ReactNode = undefined;
                switch (params.row.hotelStatus) {
                    case 'available':
                        hotelIcon = (
                            <Tooltip title="Pending volunteer preferences">
                                <HotelIcon color="error" fontSize="small" />
                            </Tooltip>
                        );
                        break;

                    case 'submitted':
                        hotelIcon = (
                            <Tooltip title="Preferences shared, pending confirmation">
                                <HotelIcon color="warning" fontSize="small" />
                            </Tooltip>
                        );
                        break;

                    case 'skipped':
                        hotelIcon = (
                            <Tooltip title="Skipped">
                                <HotelIcon color="success" fontSize="small" />
                            </Tooltip>
                        );
                        break;

                    case 'confirmed':
                        hotelIcon = (
                            <Tooltip title="Confirmed">
                                <HotelIcon color="success" fontSize="small" />
                            </Tooltip>
                        );
                        break;
                }

                let trainingIcon: React.ReactNode = undefined;
                switch (params.row.trainingStatus) {
                    case 'available':
                        trainingIcon = (
                            <Tooltip title="Pending volunteer preferences">
                                <HistoryEduIcon color="error" fontSize="small" />
                            </Tooltip>
                        );
                        break;

                    case 'submitted':
                        trainingIcon = (
                            <Tooltip title="Preferences shared, pending confirmation">
                                <HistoryEduIcon color="warning" fontSize="small" />
                            </Tooltip>
                        );
                        break;

                    case 'skipped':
                        trainingIcon = (
                            <Tooltip title="Skipped">
                                <HistoryEduIcon color="success" fontSize="small" />
                            </Tooltip>
                        );
                        break;

                    case 'confirmed':
                        trainingIcon = (
                            <Tooltip title="Confirmed">
                                <HistoryEduIcon color="success" fontSize="small" />
                            </Tooltip>
                        );
                        break;
                }

                return (
                    <Stack direction="row" spacing={1}>
                        {hotelIcon}
                        {trainingIcon}
                        { !params.row.date &&
                            <Tooltip title="Registration date missing">
                                <HistoryToggleOffIcon color="warning" fontSize="small" />
                            </Tooltip> }
                    </Stack>
                );
            },
        }
    ];

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ pb: 1 }}>
                {props.title} ({props.volunteers.length} people)
            </Typography>
            <DataTable columns={columns} rows={props.volunteers}
                       pageSize={props.volunteers.length}
                       dense disableFooter enableFilter />
        </Paper>
    )
}
