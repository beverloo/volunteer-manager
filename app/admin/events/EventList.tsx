// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';

import type { GridRenderCellParams } from '@mui/x-data-grid';
import { default as MuiLink } from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

import type { DataTableColumn } from '@app/admin/DataTable';
import { DataTable } from '@app/admin/components/DataTable';
import { TeamChip } from '@app/admin/components/TeamChip';
import { dayjs } from '@lib/DateTime';

/**
 * Icon to show for events that are currently active.
 */
const kEventActiveIcon = (
    <Tooltip title="This event is currently active">
        <VisibilityIcon color="success" fontSize="small" />
    </Tooltip>
);

/**
 * Icon to show for teams that are currently suspended.
 */
const kEventSuspendedIcon = (
    <Tooltip title="This event has been suspended">
        <VisibilityOffIcon color="disabled" fontSize="small" />
    </Tooltip>
);

/**
 * Information for an individual event that should be listed on this page. Access checks should
 * already have been done, as we'd be leaking data if it ends up on the client anyway.
 */
export interface EventListEntry {
    /**
     * Unique ID of the event as it exists in the database.
     */
    id: number;

    /**
     * Whether the event has been hidden, i.e. no longer visible with access revoked.
     */
    hidden: boolean;

    /**
     * Short name of the event as volunteers can recognise it.
     */
    shortName: string;

    /**
     * Slug of the event, through which it is identified in URLs.
     */
    slug: string;

    /**
     * Date and time at which the event will commence.
     */
    startTime: string;

    /**
     * Date and time at which the event will finish.
     */
    endTime: string;

    /**
     * Names of the teams that have participated in this event.
     */
    teams: {
        /**
         * Name of this team, human readable.
         */
        name: string;

        /**
         * Colours (as HTML colours) in which this team should be highlighted.
         */
        dark: string;
        light: string;
    }[];
}

/**
 * Props accepted by the <EventList> component.
 */
export interface EventListProps {
    /**
     * The events that should be displayed on this page. There should be at least one.
     */
    events: EventListEntry[];
}

/**
 * The <EventList> component displays a list of the events that exist within the AnimeCon Volunteer
 * Manager. While the exact selection depends on the access granted to the signed in user, in many
 * cases it will be more complete than the menu drop-down list.
 */
export function EventList(props: EventListProps) {
    const columns: DataTableColumn[] = [
        {
            field: 'hidden',
            headerName: '',
            sortable: false,
            align: 'center',
            width: 75,

            renderCell: (params: GridRenderCellParams) =>
                params.value ? kEventSuspendedIcon : kEventActiveIcon,
        },
        {
            field: 'shortName',
            headerName: 'Name',
            sortable: true,
            flex: 2,

            renderCell: (params: GridRenderCellParams) =>
                <MuiLink component={Link} href={`/admin/events/${params.row.slug}`}>
                    {params.value}
                </MuiLink>
        },
        {
            field: 'startTime',
            headerName: 'Begin',
            sortable: true,
            flex: 1,

            renderCell: (params: GridRenderCellParams) => dayjs(params.value).format('YYYY-MM-DD')
        },
        {
            field: 'endTime',
            headerName: 'End',
            sortable: true,
            flex: 1,

            renderCell: (params: GridRenderCellParams) => dayjs(params.value).format('YYYY-MM-DD')
        },
        {
            field: 'teams',
            headerName: 'Teams',
            sortable: false,
            flex: 2,

            renderCell: (params: GridRenderCellParams) => {
                if (!params.value.length)
                    return undefined;

                const teams = [ ...params.value ] as EventListEntry['teams'];
                teams.sort((lhs, rhs) => lhs.name.localeCompare(rhs.name));

                return (
                    <Stack direction="row" spacing={1}>
                        { teams.map((team, index) =>
                            <TeamChip key={index} colours={team} label={team.name} /> ) }
                    </Stack>
                );
            },
        }
    ];

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ pb: 1 }}>
                AnimeCon Events
            </Typography>
            <DataTable columns={columns} rows={props.events}
                       defaultSort={{ field: 'startTime', sort: 'desc' }} disableFooter />
        </Paper>
    );
}
