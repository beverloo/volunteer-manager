// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import type { SubscriptionsRowModel } from '@app/api/admin/subscriptions/[[...id]]/route';
import { RemoteDataTable, type RemoteDataTableColumn } from '@app/admin/components/RemoteDataTable';

/**
 * The <SubscriptionTable> component displays a MUI Data Grid that lists all individuals who are
 * eligible to be subscribed to notifications, together with the notifications and channels that
 * they are subscribed to.
 */
export function SubscriptionTable() {
    const columns: RemoteDataTableColumn<SubscriptionsRowModel>[] = [

    ];

    return (
        <RemoteDataTable columns={columns} endpoint="/api/admin/subscriptions"
                         defaultSort={{ field: 'id', sort: 'asc' }} pageSize={100}
                         disableFooter enableUpdate />
    );
}
