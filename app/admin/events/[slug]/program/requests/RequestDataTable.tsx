// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';

import { default as MuiLink } from '@mui/material/Link';
import AddTaskIcon from '@mui/icons-material/AddTask';
import Box from '@mui/material/Box';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import Chip from '@mui/material/Chip';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import Tooltip from '@mui/material/Tooltip';

import type { ProgramRequestContext, ProgramRequestRowModel } from '@app/api/admin/program/requests/[[...id]]/route';
import { type RemoteDataTableColumn, RemoteDataTable } from '@app/admin/components/RemoteDataTable';

/**
 * Information about a particular team shown on the request overview table.
 */
export interface TeamInfo {
    /**
     * Unique ID of the team, used for matching assigned shifts.
     */
    id: number;

    /**
     * Colour, as an HTML-valid colour code, the team identifies themselves with.
     */
    colour: string;

    /**
     * Environment of the team, as they're identified in URLs.
     */
    environment: string;

    /**
     * Name of the team, as they should be labelled.
     */
    name: string;
}

/**
 * Props accepted by the <RequestDataTable> component.
 */
export type RequestDataTableProps = ProgramRequestContext & {
    /**
     * Leaders to whom a request can be assigned.
     */
    leaders: string[];

    /**
     * Whether the request data table should be considered read only, typically becauses the signed
     * in user doesn't have access to be an assignee.
     */
    readOnly?: boolean;

    /**
     * Teams that exist for the current event, and need to be considered for shift planning.
     */
    teams: TeamInfo[];
}

/**
 * The <RequestDataTable> component displays all received requests, together with their assignee and
 * shift status for each of the participating teams.
 */
export function RequestDataTable(props: RequestDataTableProps) {
    const columns: RemoteDataTableColumn<ProgramRequestRowModel>[] = [
        {
            field: 'activity',
            headerName: 'Activity',
            editable: false,
            sortable: false,
            flex: 3,

            renderCell: params => {
                const href = `/admin/events/${props.event}/program/activities/${params.row.id}`;
                return (
                    <MuiLink component={Link} href={href}>
                        {params.value}
                    </MuiLink>
                );
            },
        },
        {
            field: 'status',
            headerName: 'Status',
            editable: false,
            sortable: false,
            flex: 1,

            renderCell: params => {
                switch (params.value) {
                    case 'Contacting':
                        return (
                            <Tooltip title="Someone is coordinating with the event owner">
                                <Chip size="small" label="Contacting" color="warning" />
                            </Tooltip>
                        );

                    case 'Scheduled':
                        return (
                            <Tooltip title="Shifts for this activity has been scheduled">
                                <Chip size="small" label="Scheduled" color="success" />
                            </Tooltip>
                        );

                    case 'Unknown':
                    default:
                        return (
                            <Tooltip title="This request has not been picked up yet">
                                <Chip size="small" label="Unknown" color="error" />
                            </Tooltip>
                        );
                }
            },
        },
        {
            field: 'assignee',
            headerName: 'Assignee',
            editable: !props.readOnly,
            sortable: false,
            flex: 2,
        },
        {
            field: 'notes',
            headerName: 'Notes',
            editable: !props.readOnly,
            sortable: false,
            flex: 3,
        }
    ];

    for (const team of props.teams) {
        console.log(team);
        columns.push({
            field: `id_${team.id}`,
            headerAlign: 'center',
            editable: false,
            sortable: false,
            align: 'center',
            width: 50,

            renderHeader: params => {
                return (
                    <Tooltip title={team.name}>
                        <Box sx={{
                            backgroundColor: team.colour,
                            border: '1px solid transparent',
                            borderColor: 'divider',
                            borderRadius: 1,
                            height: '21px',
                            width: '21px',
                        }} />
                    </Tooltip>
                );
            },

            renderCell: params => {
                if (!Object.hasOwn(params.row.shifts, team.id)) {
                    return (
                        <Tooltip title="No shifts have been scheduled">
                            <RadioButtonUncheckedIcon fontSize="small" color="disabled" />
                        </Tooltip>
                    );
                }

                const shifts = params.row.shifts[`${team.id}`];
                if (shifts.length === 1) {
                    const href =
                        `/admin/events/${props.event}/${team.environment}/shifts/${shifts[0]}`;

                    return (
                        <Tooltip title="One shift has been scheduled">
                            <MuiLink component={Link} href={href} sx={{ lineHeight: '0.5em' }}>
                                <TaskAltIcon fontSize="small" color="success" />
                            </MuiLink>
                        </Tooltip>
                    );
                } else {
                    // TODO: Properly handle the >1 case by showing a menu, and enabling the user to
                    // click through straight away to each of the shifts.
                    return (
                        <Tooltip title={`${shifts.length} shifts have been scheduled`}>
                            <AddTaskIcon fontSize="small" color="warning" />
                        </Tooltip>
                    );
                }
            },
        });
    }

    return (
        <Box sx={{ p: 2 }}>
            <RemoteDataTable columns={columns} endpoint="/api/admin/program/requests" enableUpdate
                             context={{ event: props.event }} refreshOnUpdate pageSize={25}
                             defaultSort={{ field: 'id', sort: 'asc' }} />
        </Box>
    );
}
