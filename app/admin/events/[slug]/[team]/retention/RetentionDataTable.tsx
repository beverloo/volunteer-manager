// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';

import { default as MuiLink } from '@mui/material/Link';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import type { RetentionContext, RetentionRowModel } from '@app/api/admin/retention/[[...id]]/route';
import { type RemoteDataTableColumn, RemoteDataTable } from '@app/admin/components/RemoteDataTable';

/**
 * Props accepted by the <RetentionDataTable> component.
 */
export type RetentionDataTableProps = RetentionContext & {
    /**
     * Leaders to whom a retention action can be assigned.
     */
    leaders: string[];
};

/**
 * The <RetentionDataTable> component displays a remote data table with the volunteers who might be
 * interested in joining this event. It combines multi-event and multi-team participation, and
 * reaching out to particular volunteers can be claimed by any of the seniors.
 */
export function RetentionDataTable(props: RetentionDataTableProps) {
    const columns: RemoteDataTableColumn<RetentionRowModel>[] = [
        {
            field: 'name',
            headerName: 'Volunteer',
            editable: false,
            sortable: false,
            flex: 2,

            renderCell: params => {
                let href = `/admin/events/${props.event}/`;
                switch (params.row.status) {
                    case 'Applied':
                        href += `${params.row.statusTeam}/applications`;
                        break;

                    case 'Retained':
                        href += `${params.row.statusTeam}/volunteers/${params.row.id}`;
                        break;

                    default:
                        return (
                            <Typography component="span" variant="body2"
                                        sx={{ color: 'action.active' }}>
                                {params.value}
                            </Typography>
                        );
                }

                return (
                    <MuiLink component={Link} href={href}>
                        {params.value}
                    </MuiLink>
                );
            },
        },
        {
            field: 'latestEvent',
            headerName: 'Latest event',
            editable: false,
            sortable: false,
            flex: 2,

            renderCell: params => {
                const href =
                    `/admin/events/${params.row.latestEventSlug}/${props.team}/volunteers/` +
                    `${params.row.id}`;

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
            editable: true,
            sortable: false,
            flex: 1,

            type: 'singleSelect',
            valueOptions: [ 'Unknown', 'Contacting', 'Declined' ],

            renderCell: params => {
                let color: 'success' | 'warning' | 'error' | undefined = undefined;
                let explanation: string = '';

                switch (params.value) {
                    case 'Unknown':
                        explanation = 'They have not been contacted yet';
                        break;

                    case 'Contacting':
                        color = 'warning';
                        explanation = 'Someone is contacting them';
                        break;

                    case 'Declined':
                        color = 'error';
                        explanation = 'They cannot help out this time';
                        break;

                    case 'Applied':
                        color = 'success';
                        explanation = 'They have applied to help out again!';
                        break;

                    case 'Retained':
                        color = 'success';
                        explanation = 'They are helping out again!';
                        break;
                }

                return (
                    <Tooltip title={explanation}>
                        <Chip size="small" label={params.value} color={color} />
                    </Tooltip>
                );
            },
        },
        {
            field: 'assigneeName',
            headerName: 'Assignee',
            editable: true,
            sortable: false,
            flex: 2,

            type: 'singleSelect',
            valueOptions: [ ' ', ...props.leaders ],

            renderCell: params => {
                if (!!params.value)
                    return params.value;

                return (
                    <Typography component="span" variant="body2"
                                sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                        Unassigned
                    </Typography>
                );
            }
        },
        {
            field: 'notes',
            headerName: 'Notes',
            editable: true,
            sortable: false,
            flex: 3,

            renderCell: params => {
                if (!!params.value)
                    return params.value;

                return (
                    <Typography component="span" variant="body2"
                                sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                        …
                    </Typography>
                );
            }
        }
    ];

    return (
        <RemoteDataTable columns={columns} endpoint="/api/admin/retention" enableUpdate
                         context={{ event: props.event, team: props.team }} refreshOnUpdate
                         defaultSort={{ field: 'id', sort: 'asc' }} pageSize={100} disableFooter />
    );
}
