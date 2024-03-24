// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';

import { default as MuiLink } from '@mui/material/Link';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import LaunchIcon from '@mui/icons-material/Launch';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

import type { ProgramActivitiesRowModel } from '@app/api/admin/program/activities/[[...id]]/route';
import { RemoteDataTable, type RemoteDataTableColumn } from '@app/admin/components/RemoteDataTable';

/**
 * Props accepted by the <ActivityDataTable> component.
 */
export interface ActivityDataTableProps {
    /**
     * Unique slug of the event for which activities should be shown.
     */
    event: string;
}

/**
 * The <ActivityDataTable> component displays a remote data table containing all the activities that
 * are known to the program of a particular festival. It links through to a separate page for each
 * activity displaying more information and timeslots. Activities can be created as well.
 */
export function ActivityDataTable(props: ActivityDataTableProps) {
    const context = { event: props.event };
    const columns: RemoteDataTableColumn<ProgramActivitiesRowModel>[] = [
        {
            field: 'id',
            display: 'flex',
            headerName: '',
            align: 'center',
            sortable: false,
            width: 50,

            renderCell: params => {
                if (!params.row.anplanLink) {
                    return (
                        <Tooltip title="This activity does not exist in AnPlan">
                            <LaunchIcon color="disabled" fontSize="small" />
                        </Tooltip>
                    );
                } else {
                    return (
                        <Tooltip title="Open this activity in AnPlan">
                            <IconButton component={Link} href={params.row.anplanLink}
                                        target="_blank">
                                <LaunchIcon color="info" fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    );
                }
            },
        },
        {
            field: 'title',
            headerName: 'Activity',
            flex: 2,

            renderCell: params =>
                <MuiLink component={Link} href={`./activities/${params.row.id}`}>
                    {params.value}
                </MuiLink>,
        },
        {
            field: 'location',
            display: 'flex',
            headerName: 'Location',
            flex: 1,

            renderCell: params => {
                if (!!params.row.locationId) {
                    return (
                        <>
                            <MuiLink component={Link} href="./locations">
                                {params.value}
                            </MuiLink>
                            { params.row.timeslots > 1 &&
                                <Typography variant="body2" sx={{ pl: .5, color: 'text.disabled' }}>
                                    ({params.row.timeslots}x)
                                </Typography> }
                        </>
                    );
                } else {
                    return (
                        <>
                            {params.value}
                            { params.row.timeslots > 1 &&
                                <Typography variant="body2" sx={{ pl: .5, color: 'text.disabled' }}>
                                    ({params.row.timeslots}x)
                                </Typography> }
                        </>
                    );
                }
            },
        },
        {
            field: 'helpRequested',
            display: 'flex',
            headerName: '',
            align: 'center',
            sortable: true,
            width: 50,

            renderCell: params => {
                if (params.row.shiftScheduled) {
                    return (
                        <Tooltip title="Shifts have been scheduled">
                            <NewReleasesIcon color="success" fontSize="small" />
                        </Tooltip>
                    );
                } else if (params.row.helpRequested) {
                    return (
                        <Tooltip title="Help has been requested">
                            <NewReleasesIcon color="error" fontSize="small" />
                        </Tooltip>
                    );
                } else {
                    return (
                        <Tooltip title="No help has been requested">
                            <MoreHorizIcon color="disabled" fontSize="small" />
                        </Tooltip>
                    );
                }
            },
        },
        {
            field: 'visible',
            display: 'flex',
            headerName: '',
            align: 'center',
            sortable: true,
            width: 50,

            renderCell: params => {
                if (!!params.value) {
                    return (
                        <Tooltip title="This activity has been announced">
                            <VisibilityIcon color="disabled" fontSize="small" />
                        </Tooltip>
                    );
                } else {
                    return (
                        <Tooltip title="This activity should be kept private">
                            <VisibilityOffIcon color="warning" fontSize="small" />
                        </Tooltip>
                    );
                }
            },
        }
    ];

    return (
        <Box sx={{ p: 2 }}>
            <RemoteDataTable columns={columns} endpoint="/api/admin/program/activities"
                             context={context} pageSize={10}
                             defaultSort={{ field: 'title', sort: 'asc' }} />
        </Box>
    );
}
