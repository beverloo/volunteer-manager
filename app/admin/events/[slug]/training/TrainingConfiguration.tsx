// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

import type { GridRenderCellParams, GridValidRowModel } from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import type { PageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import type { TrainingDefinition } from '@app/api/admin/training';
import type { UpdatePublicationDefinition } from '@app/api/admin/updatePublication';
import { type DataTableColumn, DataTable } from '@app/admin/DataTable';
import { PublishAlert } from '@app/admin/components/PublishAlert';
import { dayjs } from '@lib/DateTime';
import { issueServerAction } from '@lib/issueServerAction';

/**
 * Configuration options available for a training session. Can be amended by this page.
 */
export interface TrainingConfigurationEntry {
    /**
     * Unique ID of this entry in the training configuration.
     */
    id: number;

    /**
     * Address at which the training will be taking place.
     */
    trainingAddress?: string;

    /**
     * Maximum capacity of the training.
     */
    trainingCapacity?: number;

    /**
     * Date and time at which the training will commence.
     */
    trainingStart?: Date;

    /**
     * Date and time at which the training will conclude.
     */
    trainingEnd?: Date;
}

/**
 * Props accepted by the <TrainingConfiguration> component.
 */
export interface TrainingConfigurationProps {
    /**
     * Information about the event for which training sessions are being shown.
     */
    event: PageInfo['event'];

    /**
     * The training sessions that can be displayed by this component.
     */
    trainings: TrainingConfigurationEntry[];
}

/**
 * The <TrainingConfiguration> component displays the options that are available for our volunteers
 * to get trained ahead of the convention. This is a fairly straightforward set of dates.
 */
export function TrainingConfiguration(props: TrainingConfigurationProps) {
    const { event } = props;

    async function commitAdd(): Promise<TrainingConfigurationEntry> {
        const response = await issueServerAction<TrainingDefinition>('/api/admin/training', {
            event: event.slug,
            create: { /* empty payload */ }
        });

        if (!response.id)
            throw new Error('The server was unable to create a new training session.');

        return {
            id: response.id,
            trainingCapacity: 10,
            trainingAddress: undefined,
            trainingStart: event.startTime,
            trainingEnd: event.endTime,
        };
    }

    async function commitDelete(oldRow: GridValidRowModel) {
        await issueServerAction<TrainingDefinition>('/api/admin/training', {
            event: event.slug,
            delete: {
                id: oldRow.id,
            },
        });
    }

    async function commitEdit(newRow: GridValidRowModel, oldRow: GridValidRowModel) {
        const response = await issueServerAction<TrainingDefinition>('/api/admin/training', {
            event: event.slug,
            update: {
                id: oldRow.id,
                trainingAddress: newRow.trainingAddress,
                trainingStart: newRow.trainingStart,
                trainingEnd: newRow.trainingEnd,
                trainingCapacity: newRow.trainingCapacity,
            }
        });

        return response.success ? newRow : oldRow;
    }

    const router = useRouter();

    const onPublish = useCallback(async (domEvent: unknown, publish: boolean) => {
        const response = await issueServerAction<UpdatePublicationDefinition>(
            '/api/admin/update-publication', {
                event: event.slug,
                publishTrainings: !!publish,
            });

        if (response.success)
            router.refresh();

    }, [ event, router ]);

    const columns: DataTableColumn[] = [
        {
            field: 'id',
            headerName: /* empty= */ '',
            sortable: false,
            width: 50,
        },
        {
            field: 'trainingStart',
            headerName: 'Date (start time)',
            editable: true,
            sortable: true,
            type: 'dateTime',
            flex: 2,

            renderCell: (params: GridRenderCellParams) =>
                dayjs(params.value).format('YYYY-MM-DD [at] H:mm'),
        },
        {
            field: 'trainingEnd',
            headerName: 'Date (end time)',
            editable: true,
            sortable: true,
            type: 'dateTime',
            flex: 2,

            renderCell: (params: GridRenderCellParams) =>
                dayjs(params.value).format('YYYY-MM-DD [at] H:mm'),
        },
        {
            field: 'trainingAddress',
            headerName: 'Address',
            editable: true,
            sortable: true,
            flex: 3,
        },
        {
            field: 'trainingCapacity',
            headerName: 'Capacity',
            editable: true,
            sortable: true,
            type: 'number',
            flex: 1,
        },
    ];

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ pb: 1 }}>
                Training sessions
            </Typography>
            <PublishAlert published={event.publishTrainings} sx={{ mb: 2 }} onClick={onPublish}>
                { event.publishTrainings
                    ? 'Training information has been published to volunteers.'
                    : 'Training information has not yet been published to volunteers.' }
            </PublishAlert>
            <DataTable commitAdd={commitAdd} commitDelete={commitDelete} commitEdit={commitEdit}
                       messageSubject="training" rows={props.trainings} columns={columns}
                       disableFooter dense />
        </Paper>
    );
}
