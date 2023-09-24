// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

import type { GridRenderCellParams, GridValidRowModel } from '@mui/x-data-grid';
import Alert from '@mui/material/Alert';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import type { DataTableColumn } from '@app/admin/DataTable';
import type { UpdateRoleDefinition } from '@app/api/admin/updateRole';
import { DataTable } from '@app/admin/DataTable';
import { VolunteerBadge, VolunteerBadgeVariant } from '@components/VolunteerBadge';
import { issueServerAction } from '@lib/issueServerAction';

/**
 * Interface representation of a role in the Volunteer Manager.
 */
export type Role = UpdateRoleDefinition['request'];

/**
 * Props accepted by the <Roles> component.
 */
export interface RolesProps {
    /**
     * The roles that exist in the Volunteer Manager.
     */
    roles: Role[];
}

/**
 * The <Roles> component represents the roles that exist in the Volunteer Manager. Each role has a
 * few basic settings that can be manipulated as a <DataTable>.
 */
export function Roles(props: RolesProps) {
    const { roles } = props;

    const columns: DataTableColumn[] = [
        {
            field: 'roleOrder',
            headerName: '#',
            headerAlign: 'center',
            editable: true,
            sortable: true,
            align: 'center',
            width: 75,

            type: 'singleSelect',
            valueOptions: [ 0, 1, 2, 3, 4, 5 ],
        },
        {
            field: 'roleName',
            headerName: 'Role',
            editable: true,
            sortable: true,
            flex: 2,
        },
        {
            field: 'roleBadge',
            headerName: 'Badge',
            editable: true,
            sortable: false,
            flex: 1,

            renderCell: (row: GridRenderCellParams) => {
                return row.value ? <VolunteerBadge variant={row.value}
                                                   fontSize="small" color="primary" />
                                 : undefined;
            },

            type: 'singleSelect',
            valueOptions: [ '(none)', ...Object.keys(VolunteerBadgeVariant) ],
        },
        {
            field: 'adminAccess',
            headerName: 'Admin',
            description: 'Whether this role grants admin access to an event',
            editable: true,
            sortable: false,
            type: 'boolean',

            renderCell: (params: GridRenderCellParams) => {
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

            renderCell: (params: GridRenderCellParams) => {
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

            renderCell: (params: GridRenderCellParams) => {
                return !!params.value ? <CheckCircleIcon fontSize="small" color="success" />
                                      : <CancelIcon fontSize="small" color="error" />;
            },
        }
    ];

    const router = useRouter();

    const commitEdit = useCallback(async (newRow: GridValidRowModel, oldRow: GridValidRowModel) => {
        const response = await issueServerAction<UpdateRoleDefinition>('/api/admin/update-role', {
            ...newRow as Role,
            roleBadge: newRow.roleBadge !== '(none)' ? newRow.roleBadge : undefined,
        });

        if (!response.success)
            return oldRow;

        router.refresh();
        return newRow;

    }, [ router ]);

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ mb: 1 }}>
                Roles
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
                This table is editable, and can be used to update the settings for each role.
            </Alert>
            <DataTable dense disableFooter commitEdit={commitEdit}
                       columns={columns} rows={roles} />
        </Paper>
    );
}
