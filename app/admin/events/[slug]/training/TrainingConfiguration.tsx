// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import type { PageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import { PublishAlert } from '@app/admin/components/PublishAlert';
import { TrainingConfigurationTable } from './TrainingConfigurationTable';
import { callApi } from '@lib/callApi';

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
        const response = await callApi('post', '/api/admin/update-publication', {
            event: event.slug,
            publishTrainings: !!publish,
        });

        if (response.success)
            router.refresh();

    }, [ event, router ]);

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
            <TrainingConfigurationTable event={props.event.slug} timezone={props.event.timezone} />
        </Paper>
    );
}
