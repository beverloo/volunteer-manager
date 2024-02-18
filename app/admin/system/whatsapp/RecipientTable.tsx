// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';

import { default as MuiLink } from '@mui/material/Link';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import Tooltip from '@mui/material/Tooltip';

import type { WhatsAppRowModel } from '@app/api/admin/whatsapp/recipients/[[...id]]/route';
import { RemoteDataTable, type RemoteDataTableColumn } from '@app/admin/components/RemoteDataTable';
import { WhatsAppChannelApplications } from '@lib/database/Types';

/**
 * Channel options for the "applications" channel.
 */
const kChannelApplicationsOptions = [
    { value: undefined, label: 'None' },
    { value: WhatsAppChannelApplications.All, label: 'All applications' },
    { value: WhatsAppChannelApplications.Team, label: 'Team applications' },
];

/**
 * Props accepted by the <RecipientTable> component.
 */
export interface RecipientTableProps {
    /**
     * Users that can be selected as WhatsApp recipients.
     */
    users: { value: number, label: string }[];
}

/**
 * The <RecipientTable> component displays an editable, remote data table through which the WhatsApp
 * delivery list can be modified. Individuals can be added, but must be registered users.
 */
export function RecipientTable(props: RecipientTableProps) {
    function findUsername(userId: number) {
        for (const { value, label } of props.users) {
            if (value === userId)
                return label;
        }

        return undefined;
    }

    const columns: RemoteDataTableColumn<WhatsAppRowModel>[] = [
        {
            field: 'id',
            editable: false,
            sortable: false,
            width: 50,
        },
        {
            field: 'userId',
            headerName: 'Recipient',
            editable: true,
            sortable: false,
            flex: 2,

            type: 'singleSelect',
            valueOptions: props.users,

            renderCell: params =>
                <MuiLink component={Link} href={`/admin/volunteers/${params.value}`}>
                    { findUsername(params.value) ?? params.row.username }
                </MuiLink>
        },
        {
            field: 'channelApplications',
            description: 'Received volunteering applications',
            headerName: 'Applications',
            headerAlign: 'center',
            align: 'center',
            editable: true,
            sortable: false,
            flex: 1,

            type: 'singleSelect',
            valueOptions: kChannelApplicationsOptions,

            renderCell: params => {
                switch (params.value) {
                    case WhatsAppChannelApplications.All:
                        return (
                            <Tooltip title="Receiving all applications">
                                <CheckCircleIcon color="success" fontSize="small" />
                            </Tooltip>
                        );
                    case WhatsAppChannelApplications.Team:
                        return (
                            <Tooltip title="Receiving notifications from their team">
                                <GroupWorkIcon color="success" fontSize="small" />
                            </Tooltip>
                        );
                    default:
                        return (
                            <Tooltip title="Not receiving any notifications">
                                <CancelIcon color="error" fontSize="small" />
                            </Tooltip>
                        );
                }
            },
        }
    ];

    return <RemoteDataTable endpoint="/api/admin/whatsapp/recipients" columns={columns}
                            defaultSort={{ field: 'username', sort: 'asc' }} pageSize={100}
                            disableFooter enableCreate enableDelete enableUpdate
                            subject="recipient" />;
}
