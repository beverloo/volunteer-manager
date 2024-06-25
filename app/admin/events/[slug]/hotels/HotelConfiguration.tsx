// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import type { PageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import { HotelConfigurationTable } from './HotelConfigurationTable';
import { PublishAlert } from '@app/admin/components/PublishAlert';
import { callApi } from '@lib/callApi';

/**
 * Props accepted by the <HotelConfiguration> component.
 */
export interface HotelConfigurationProps {
    /**
     * Information about the event for which hotel rooms are being shown.
     */
    event: PageInfo['event'];
}

/**
 * The <HotelConfiguration> component allows event administrators to add or remove hotel and hotel
 * rooms to settings. Changes will be reflected on the volunteer portal immediately.
 */
export function HotelConfiguration(props: HotelConfigurationProps) {
    const { event } = props;

    const router = useRouter();

    const onPublish = useCallback(async (domEvent: unknown, publish: boolean) => {
        const response = await callApi('post', '/api/admin/update-publication', {
            event: event.slug,
            publishHotels: !!publish,
        });

        if (response.success)
            router.refresh();

    }, [ event, router ]);

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ pb: 1 }}>
                Hotel room configuration
            </Typography>
            <PublishAlert published={event.publishHotels} sx={{ mb: 2 }} onClick={onPublish}>
                { event.publishHotels
                    ? 'Hotel room information has been published to volunteers.'
                    : 'Hotel room information has not yet been published to volunteers.' }
            </PublishAlert>
            <HotelConfigurationTable event={event.slug} />
        </Paper>
    );
}
