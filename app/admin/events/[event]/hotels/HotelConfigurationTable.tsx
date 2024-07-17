// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import type { HotelsRowModel } from '@app/api/admin/hotels/[[...id]]/route';
import { RemoteDataTable, type RemoteDataTableColumn } from '@app/admin/components/RemoteDataTable';

/**
 * Helper function for formatting prices in the configuration data table.
 */
const kPriceFormatter = new Intl.NumberFormat('en-UK', { style: 'currency', currency: 'EUR' });

/**
 * Props accepted by the <HotelConfigurationTable> component.
 */
interface HotelConfigurationTableProps {
    /**
     * The event for which this table is being displayed.
     */
    event: string;
}

/**
 * The <HotelConfigurationTable> component displays the data table through which hotel rooms can be
 * configured. It's a client-side component as we apply a certain degree of markup.
 */
export function HotelConfigurationTable(props: HotelConfigurationTableProps) {
    const context = { event: props.event };
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
        <RemoteDataTable endpoint="/api/admin/hotels" context={context}
                         columns={columns} defaultSort={{ field: 'hotelName', sort: 'asc' }}
                         disableFooter enableCreate enableDelete enableUpdate
                         refreshOnUpdate subject="hotel" />
    );
}
