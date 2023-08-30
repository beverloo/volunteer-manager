// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

import type { GridRenderCellParams, GridValidRowModel } from '@mui/x-data-grid';
import Alert from '@mui/material/Alert';
import CheckIcon from '@mui/icons-material/Check';
import DoNotDisturbIcon from '@mui/icons-material/DoNotDisturb';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import type { DataTableColumn } from '@app/admin/DataTable';
import type { PageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import type { UpdateEventDefinition } from '@app/api/admin/updateEvent';
import { DataTable } from '@app/admin/DataTable';
import { issueServerAction } from '@lib/issueServerAction';

/**
 * Settings related to an individual team whose settings can be updated on this page.
 */
export interface TeamSettings {
    /**
     * Unique ID of the team as it exists in the database.
     */
    id: number;

    /**
     * Name of the team that these settings are for.
     */
    name: string;

    /**
     * The ideal number of volunteers that we'll recruit into this team.
     */
    targetSize?: number;

    /**
     * Whether this team participates in this event at all.
     */
    enableTeam?: boolean;

    /**
     * Whether this team's volunteer portal highlights this event.
     */
    enableContent?: boolean;

    /**
     * Whether this team is currently accepting applications for new volunteers.
     */
    enableRegistration?: boolean;

    /**
     * Whether volunteers in this team can access the volunteer portal.
     */
    enableSchedule?: boolean;
}

/**
 * Props accepted by the <TeamSettings> component.
 */
export interface TeamSettingsProps {
    /**
     * Information about the event whose settings are being changed.
     */
    event: PageInfo['event'];

    /**
     * The teams that should be displayed as configurable on this page.
     */
    teams: TeamSettings[];
}

/**
 * The <TeamSettings> component allows administrators to change settings regarding the individual
 * teams that take part in an event. Team settings include availability of content, the schedule, as
 * well as targets regarding the number of volunteers that should participate.
 */
export function TeamSettings(props: TeamSettingsProps) {
    const { event, teams } = props;

    const columns: DataTableColumn[] = [
        {
            field: 'enableTeam',
            headerName: '',
            editable: true,
            sortable: false,
            type: 'boolean',
            width: 75,

            renderCell: (params: GridRenderCellParams) => {
                return !params.row.enableTeam ? <DoNotDisturbIcon color="error" fontSize="small" />
                                              : <CheckIcon color="success" fontSize="small" />;
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
            flex: 1,
        },
        {
            field: 'enableContent',
            headerName: 'Publish content',
            description: 'Share information with prospective volunteers?',
            editable: true,
            sortable: false,
            type: 'boolean',
            flex: 1,
        },
        {
            field: 'enableSchedule',
            headerName: 'Publish schedules',
            description: 'Can volunteers access their schedules?',
            editable: true,
            sortable: false,
            type: 'boolean',
            flex: 1,
        },
        {
            field: 'enableRegistration',
            headerName: 'Accept applications',
            description: 'Are we still accepting incoming applications?',
            editable: true,
            sortable: false,
            type: 'boolean',
            flex: 1,
        },
    ];

    const router = useRouter();

    const handleEdit = useCallback(async (newRow: GridValidRowModel, oldRow: GridValidRowModel) => {
        const response = await issueServerAction<UpdateEventDefinition>('/api/admin/update-event', {
            event: event.slug,
            team: {
                id: oldRow.id,

                enableTeam: !!newRow.enableTeam,
                enableContent: !!newRow.enableContent,
                enableRegistration: !!newRow.enableRegistration,
                enableSchedule: !!newRow.enableSchedule,
                targetSize: newRow.targetSize,
            }
        });

        if (!response.success)
            return oldRow;

        router.refresh();
        return newRow;

    }, [ event, router ]);

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ pb: 2 }}>
                Team settings
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
                Double click to edit the settings for <strong>{event.shortName}</strong> associated
                with a particular team.
            </Alert>
            <DataTable dense disableFooter columns={columns} rows={teams} commitEdit={handleEdit} />
        </Paper>
    );
}
