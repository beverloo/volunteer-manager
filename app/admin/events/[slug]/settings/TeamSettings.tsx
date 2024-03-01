// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Alert from '@mui/material/Alert';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import type { EventTeamRowModel } from '@app/api/admin/event/teams/[[...id]]/route';
import type { PageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import { RemoteDataTable, type RemoteDataTableColumn } from '@app/admin/components/RemoteDataTable';

/**
 * Props accepted by the <TeamSettings> component.
 */
export interface TeamSettingsProps {
    /**
     * Information about the event whose settings are being changed.
     */
    event: PageInfo['event'];
}

/**
 * The <TeamSettings> component allows administrators to change settings regarding the individual
 * teams that take part in an event. Team settings include availability of content, the schedule, as
 * well as targets regarding the number of volunteers that should participate.
 */
export function TeamSettings(props: TeamSettingsProps) {
    const { event } = props;

    const context = { event: props.event.slug };
    const columns: RemoteDataTableColumn<EventTeamRowModel>[] = [
        {
            field: 'enableTeam',
            headerName: '',
            editable: true,
            sortable: false,
            type: 'boolean',
            width: 75,

            renderCell: params => {
                return !!params.value ? <CheckCircleIcon fontSize="small" color="success" />
                                      : <CancelIcon fontSize="small" color="error" />;
            },
        },
        {
            field: 'name',
            headerName: 'Team',
            editable: false,
            sortable: false,
            flex: 2,
        },
        {
            field: 'targetSize',
            headerName: 'Target # volunteers',
            headerAlign: 'center',
            description: 'How many volunteers will we ideally recruit?',
            align: 'center',
            editable: true,
            sortable: false,
            type: 'number',
            flex: 2,
        },
        {
            field: 'enableContent',
            headerName: 'Publish content',
            description: 'Share information with prospective volunteers?',
            editable: true,
            sortable: false,
            type: 'boolean',
            flex: 2,

            renderCell: params => {
                return !!params.value ? <CheckCircleIcon fontSize="small" color="success" />
                                      : <CancelIcon fontSize="small" color="error" />;
            },
        },
        {
            field: 'enableSchedule',
            headerName: 'Publish schedules',
            description: 'Can volunteers access their schedules?',
            editable: true,
            sortable: false,
            type: 'boolean',
            flex: 2,

            renderCell: params => {
                return !!params.value ? <CheckCircleIcon fontSize="small" color="success" />
                                      : <CancelIcon fontSize="small" color="error" />;
            },
        },
        {
            field: 'enableRegistration',
            headerName: 'Accept applications',
            description: 'Are we still accepting incoming applications?',
            editable: true,
            sortable: false,
            type: 'boolean',
            flex: 2,

            renderCell: params => {
                return !!params.value ? <CheckCircleIcon fontSize="small" color="success" />
                                      : <CancelIcon fontSize="small" color="error" />;
            },
        },
        {
            field: 'whatsappLink',
            headerName: 'WhatsApp invite',
            description: 'WhatsApp group invite to share with the team',
            editable: true,
            sortable: false,
            type: 'string',
            flex: 3,
        },
    ];

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ pb: 1 }}>
                Team settings
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
                Double click to edit the settings for <strong>{event.shortName}</strong> associated
                with a particular team.
            </Alert>
            <RemoteDataTable columns={columns} endpoint="/api/admin/event/teams" context={context}
                             enableUpdate defaultSort={{ field: 'name', sort: 'asc' }}
                             disableFooter />
        </Paper>
    );
}
