// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import type { RoleRowModel } from '@app/api/admin/organisation/roles/[[...id]]/route';
import { RemoteDataTable, type RemoteDataTableColumn } from '@app/admin/components/RemoteDataTable';

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
            flex: 2,
        },
        {
            field: 'availabilityEventLimit',
            align: 'center',
            headerName: 'Event flag limit',
            headerAlign: 'center',
            description: 'Number of events they can flag wanting to attend',
            editable: true,
            type: 'number',
            flex: 1,
        },
        {
            field: 'rolePermissionGrant',
            align: 'center',
            headerName: 'Permission',
            headerAlign: 'center',
            description: 'Permission (scoped) to assign to people holding this role',
            editable: true,
            flex: 1,
        },
        {
            field: 'flagDefaultRestricted',
            headerName: 'Restricted',
            description: 'Whether this role is restricted from being a team\'s default role',
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
        <RemoteDataTable columns={columns} endpoint="/api/admin/organisation/roles" enableReorder
                         enableCreate={props.enableCreate} enableUpdate disableFooter
                         defaultSort={{ field: 'roleOrder', sort: 'asc' }} pageSize={25} />
    );
}
