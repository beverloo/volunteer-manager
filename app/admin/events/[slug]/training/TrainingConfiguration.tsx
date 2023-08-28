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
     * Maximum capacity of the training.
     */
    trainingCapacity?: number;

    /**
     * Date on which the training will be taking place.
     */
    trainingDate?: Date;

    /**
     * Lead User ID of the volunteer who will be leading this training.
     */
    trainingLeadUserId?: number;
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
            trainingDate: new Date(),
            trainingLeadUserId: undefined,
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
                trainingCapacity: newRow.trainingCapacity,
                trainingDate: newRow.trainingDate,
                trainingLeadUserId: newRow.trainingLeadUserId,
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
            field: 'trainingDate',
            headerName: 'Date',
            editable: true,
            sortable: true,
            type: 'date',
            flex: 1,
        },
        {
            field: 'trainingCapacity',
            headerName: 'Capacity',
            editable: true,
            sortable: true,
            type: 'number',
            flex: 1,
        },
        {
            field: 'trainingLeadUserId',
            headerName: 'Lead',
            editable: true,
            sortable: true,
            flex: 1,
        },
    ];

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ pb: 1 }}>
                {event.shortName} training sessions
            </Typography>
            <PublishAlert published={event.publishTrainings} sx={{ mb: 2 }} onClick={onPublish}>
                { event.publishTrainings
                    ? 'Training information has been published to volunteers.'
                    : 'Training information has not yet been published to volunteers.' }
            </PublishAlert>
            <DataTable commitAdd={commitAdd} commitDelete={commitDelete} commitEdit={commitEdit}
                       messageSubject="training" rows={props.trainings} columns={columns}
                       disableFooter />
        </Paper>
    );
}
