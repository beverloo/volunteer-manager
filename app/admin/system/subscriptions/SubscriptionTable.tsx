// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';

import type { GridCellParams } from '@mui/x-data-grid-pro';
import { default as MuiLink } from '@mui/material/Link';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import Tooltip from '@mui/material/Tooltip';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

import type { SubscriptionsRowModel } from '@app/api/admin/subscriptions/[[...id]]/route';
import { RemoteDataTable, type RemoteDataTableColumn } from '@app/admin/components/RemoteDataTable';
import { SubscriptionType } from '@lib/database/Types';

/**
 * Human-readable descriptions of each of the subscriptions that can be created. Will be presented
 * in the data table.
 */
const kSubscriptionDescriptions: { [k in SubscriptionType]: string } = {
    [SubscriptionType.Application]: 'When a volunteer applies to help out in this team',
    [SubscriptionType.Registration]: 'When a volunteer has created an account',
};

/**
 * Returns whether the row indicated by the given `params` represents a user, as opposed to a
 * subscription that could be created for said user.
 */
function isUserRow(params: GridCellParams<SubscriptionsRowModel, unknown>) {
    return !params.row.id.includes('/');
}

/**
 * The <SubscriptionTable> component displays a MUI Data Grid that lists all individuals who are
 * eligible to be subscribed to notifications, together with the notifications and channels that
 * they are subscribed to.
 */
export function SubscriptionTable() {
    const columns: RemoteDataTableColumn<SubscriptionsRowModel>[] = [
        {
            field: 'name',
            headerName: 'Subscription',
            editable: false,
            sortable: false,
            flex: 1,

            renderCell: params => {
                if (isUserRow(params)) {
                    return (
                        <MuiLink component={Link} href={`/admin/volunteers/${params.row.id}`}>
                            {params.value}
                        </MuiLink>
                    );
                } else {
                    return params.value;
                }
            },
        },
        {
            field: 'description',
            headerName: 'Description',
            editable: false,
            sortable: false,
            flex: 2,

            renderCell: params =>
                params.value ||
                    (!!params.row.type ? kSubscriptionDescriptions[params.row.type] : ''),
        },
        {
            field: 'channelEmail',
            headerName: /* empty= */ '',
            headerAlign: 'center',
            align: 'center',
            editable: true,
            sortable: false,
            width: 50,

            type: 'boolean',

            renderHeader: () =>
                <Tooltip title="Distribute using e-mail">
                    <MailOutlineIcon color="primary" fontSize="small" />
                </Tooltip>,

            renderCell: params => {
                if (isUserRow(params)) {
                    return /* empty column= */ '';
                } else if (!!params.value) {
                    return <CheckCircleIcon fontSize="small" color="success" />;
                } else {
                    return <CancelIcon fontSize="small" color="error" />;
                }
            },
        },
        {
            field: 'channelNotification',
            headerName: /* empty= */ '',
            headerAlign: 'center',
            align: 'center',
            editable: true,
            sortable: false,
            width: 50,

            type: 'boolean',

            renderHeader: () =>
                <Tooltip title="Distribute using Web Push">
                    <NotificationsNoneIcon color="primary" fontSize="small" />
                </Tooltip>,

            renderCell: params => {
                if (isUserRow(params)) {
                    return /* empty column= */ '';
                } else if (!!params.value) {
                    return <CheckCircleIcon fontSize="small" color="success" />;
                } else {
                    return <CancelIcon fontSize="small" color="error" />;
                }
            },
        },
        {
            field: 'channelWhatsapp',
            headerName: /* empty= */ '',
            headerAlign: 'center',
            align: 'center',
            editable: true,
            sortable: false,
            width: 50,

            type: 'boolean',

            renderHeader: () =>
                <Tooltip title="Distribute using WhatsApp">
                    <WhatsAppIcon color="primary" fontSize="small" />
                </Tooltip>,

            renderCell: params => {
                if (isUserRow(params)) {
                    return /* empty column= */ '';
                } else if (!!params.value) {
                    return <CheckCircleIcon fontSize="small" color="success" />;
                } else {
                    return <CancelIcon fontSize="small" color="error" />;
                }
            },
        }
    ];

    return (
        <RemoteDataTable columns={columns} endpoint="/api/admin/subscriptions"
                         defaultSort={{ field: 'name', sort: 'asc' }} pageSize={100}
                         disableFooter enableUpdate isCellEditable={isUserRow} />
    );
}
