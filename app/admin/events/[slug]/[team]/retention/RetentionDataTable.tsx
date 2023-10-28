// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { RetentionContext, RetentionRowModel } from '@app/api/admin/retention/[[...id]]/route';
import { type RemoteDataTableColumn, RemoteDataTable } from '@app/admin/components/RemoteDataTable';

/**
 * Props accepted by the <RetentionDataTable> component.
 */
export type RetentionDataTableProps = RetentionContext;

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
        }
    ];

    return (
        <RemoteDataTable columns={columns} endpoint="/api/admin/retention" enableUpdate
                         context={props} defaultSort={{ field: 'id', sort: 'asc' }} />
    );
}
