// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import type { PageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import type { TrainingsRowModel } from '@app/api/admin/trainings/[[...id]]/route';
import type { UpdatePublicationDefinition } from '@app/api/admin/updatePublication';
import { PublishAlert } from '@app/admin/components/PublishAlert';
import { RemoteDataTable, type RemoteDataTableColumn } from '@app/admin/components/RemoteDataTable';
import { dayjs, fromLocalDate, toLocalDate } from '@lib/DateTime';
import { issueServerAction } from '@lib/issueServerAction';

/**
 * Props accepted by the <TrainingConfiguration> component.
 */
export interface TrainingConfigurationProps {
    /**
     * Information about the event for which training sessions are being shown.
     */
    event: PageInfo['event'];
}

/**
 * The <TrainingConfiguration> component displays the options that are available for our volunteers
 * to get trained ahead of the convention. This is a fairly straightforward set of dates.
 */
export function TrainingConfiguration(props: TrainingConfigurationProps) {
    const { event } = props;

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

    const context = { event: event.slug };
    const columns: RemoteDataTableColumn<TrainingsRowModel>[] = [
        {
            field: 'id',
            headerName: /* empty= */ '',
            sortable: false,
            width: 50,
        },
        {
            field: 'start',
            headerName: 'Date (start time)',
            type: 'dateTime',
            editable: true,
            sortable: true,
            flex: 2,

            valueGetter: params => toLocalDate(params.row.start, event.timezone),
            valueSetter: params => ({
                ...params.row,
                start: fromLocalDate(params.value, event.timezone)
            }),

            renderCell: params =>
                dayjs.utc(params.row.start).tz(event.timezone).format('YYYY-MM-DD [at] H:mm'),
        },
        {
            field: 'end',
            headerName: 'Date (end time)',
            type: 'dateTime',
            editable: true,
            sortable: true,
            flex: 2,

            valueGetter: params => toLocalDate(params.row.end, event.timezone),
            valueSetter: params => ({
                ...params.row,
                end: fromLocalDate(params.value, event.timezone)
            }),

            renderCell: params =>
                dayjs(params.row.end).tz(event.timezone).format('YYYY-MM-DD [at] H:mm'),
        },
        {
            field: 'address',
            headerName: 'Address',
            editable: true,
            sortable: true,
            flex: 3,
        },
        {
            field: 'capacity',
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
            <RemoteDataTable endpoint="/api/admin/trainings" context={context}
                             columns={columns} defaultSort={{ field: 'start', sort: 'asc' }}
                             disableFooter enableCreate enableDelete enableUpdate
                             refreshOnUpdate subject="training" />
        </Paper>
    );
}
