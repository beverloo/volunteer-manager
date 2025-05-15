// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';

import { default as MuiLink } from '@mui/material/Link';

import type { FeedbackRowModel } from '@app/api/admin/organisation/feedback/route';
import { RemoteDataTable, type RemoteDataTableColumn } from '@app/admin/components/RemoteDataTable';
import { Temporal, formatDate } from '@lib/Temporal';

/**
 * The <FeedbackDataTable> component displays the feedback that has been received through the
 * Volunteer Portal. Items are strictly read only.
 */
export function FeedbackDataTable() {
    const localTz = Temporal.Now.timeZoneId();

    const columns: RemoteDataTableColumn<FeedbackRowModel>[] = [
        {
            field: 'date',
            headerName: 'Received',
            flex: 1,

            renderCell: params => {
                const date = formatDate(
                    Temporal.ZonedDateTime.from(params.value).withTimeZone(localTz),
                    'YYYY-MM-DD HH:mm:ss');

                return (
                    <MuiLink component={Link} href={`./feedback/${params.row.id}`}>
                        {date}
                    </MuiLink>
                );
            },
        },
        {
            field: 'userName',
            headerName: 'Volunteer',
            flex: 1,

            renderCell: params => {
                if (!params.row.userId)
                    return params.value;

                return (
                    <MuiLink component={Link}
                             href={`/admin/organisation/accounts/${params.row.userId}`}>
                        {params.value}
                    </MuiLink>
                );
            },
        },
        {
            field: 'feedback',
            headerName: 'Feedback',
            flex: 4,
        }
    ];

    return <RemoteDataTable columns={columns} endpoint="/api/admin/organisation/feedback"
                            enableQueryParams defaultSort={{ field: 'date', sort: 'desc' }}
                            pageSize={50} />;
}
