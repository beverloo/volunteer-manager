// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import type { RoleRowModel } from '@app/api/admin/volunteers/roles/[[...id]]/route';
import { RemoteDataTable, type RemoteDataTableColumn } from '@app/admin/components/RemoteDataTable';
import { VolunteerBadge } from '@components/VolunteerBadge';

import { kRoleBadge } from '@lib/database/Types';

/**
 * Props accepted by the <RolesDataTable> component.
 */
interface RolesDataTableProps {
    /**
     * Whether the ability to create new roles should be enabled.
     */
    enableCreate?: boolean;
}

/**
 * The <RolesDataTable> component represents the roles that exist in the Volunteer Manager. Each
 * role has a few basic settings that can be manipulated as a Data Table.
 */
export function RolesDataTable(props: RolesDataTableProps) {
    const columns: RemoteDataTableColumn<RoleRowModel>[] = [
        {
            field: 'roleName',
            headerName: 'Role',
            editable: true,
            sortable: true,
            flex: 3,
        },
        {
            field: 'roleBadge',
            display: 'flex',
            headerName: 'Badge',
            editable: true,
            sortable: false,
            flex: 1,

            renderCell: params => {
                return params.value ? <VolunteerBadge variant={params.value}
                                                      fontSize="small" color="primary" />
                                 : undefined;
            },

            type: 'singleSelect',
            valueOptions: [ '(none)', ...Object.keys(kRoleBadge) ],
        },
        {
            field: 'availabilityEventLimit',
            headerName: 'Event flag limit',
            description: 'Number of events they can flag wanting to attend',
            editable: true,
            type: 'number',
            flex: 1,
        },
        {
            field: 'adminAccess',
            headerName: 'Admin',
            description: 'Whether this role grants admin access to an event',
            editable: true,
            sortable: false,
            type: 'boolean',
            flex: 1,

            renderCell: params => {
                return !!params.value ? <CheckCircleIcon fontSize="small" color="success" />
                                      : <CancelIcon fontSize="small" color="error" />;
            },
        },
        {
            field: 'hotelEligible',
            headerName: 'Hotel',
            description: 'Whether volunteers in this role are eligible to book a hotel room',
            editable: true,
            sortable: false,
            type: 'boolean',
            flex: 1,

            renderCell: params => {
                return !!params.value ? <CheckCircleIcon fontSize="small" color="success" />
                                      : <CancelIcon fontSize="small" color="error" />;
            },
        },
        {
            field: 'trainingEligible',
            headerName: 'Training',
            description: 'Whether volunteers in this role are eligible to participate in training',
            editable: true,
            sortable: false,
            type: 'boolean',

            renderCell: params => {
                return !!params.value ? <CheckCircleIcon fontSize="small" color="success" />
                                      : <CancelIcon fontSize="small" color="error" />;
            },
        }
    ];

    return (
        <RemoteDataTable columns={columns} endpoint="/api/admin/volunteers/roles" enableReorder
                         enableCreate={props.enableCreate} enableUpdate disableFooter
                         defaultSort={{ field: 'roleOrder', sort: 'asc' }} pageSize={25} />
    );
}
