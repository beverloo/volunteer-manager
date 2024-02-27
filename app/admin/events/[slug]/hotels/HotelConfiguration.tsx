// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import type { PageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import type { HotelsRowModel } from '@app/api/admin/hotels/[[...id]]/route';
import { PublishAlert } from '@app/admin/components/PublishAlert';
import { RemoteDataTable, type RemoteDataTableColumn } from '@app/admin/components/RemoteDataTable';
import { callApi } from '@lib/callApi';

/**
 * Helper function for formatting prices in the configuration data table.
 */
const kPriceFormatter = new Intl.NumberFormat('en-UK', { style: 'currency', currency: 'EUR' });

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

    const context = { event: event.slug };
    const columns: RemoteDataTableColumn<HotelsRowModel>[] = [
        {
            field: 'id',
            headerName: /* empty= */ '',
            sortable: false,
            width: 50,
        },
        {
            field: 'hotelName',
            headerName: 'Hotel (name)',
            editable: true,
            sortable: true,
            flex: 2,
        },
        {
            field: 'hotelDescription',
            headerName: 'Hotel (description)',
            editable: true,
            sortable: false,
            flex: 2,
        },
        {
            field: 'roomName',
            headerName: 'Room (name)',
            editable: true,
            sortable: true,
            flex: 2,
        },
        {
            field: 'roomPeople',
            headerName: 'Room (people)',
            editable: true,
            sortable: true,
            type: 'number',
            flex: 1,
        },
        {
            field: 'roomPrice',
            headerName: 'Room (price)',
            editable: true,
            sortable: true,
            type: 'number',
            flex: 1,

            renderCell: params => kPriceFormatter.format(params.value / 100),
        }
    ];

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
            <RemoteDataTable endpoint="/api/admin/hotels" context={context}
                             columns={columns} defaultSort={{ field: 'hotelName', sort: 'asc' }}
                             disableFooter enableCreate enableDelete enableUpdate
                             refreshOnUpdate subject="hotel" />
        </Paper>
    );
}
