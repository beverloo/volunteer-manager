// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import type { VendorRowModel } from '@app/api/admin/vendors/[[...id]]/route';
import { type RemoteDataTableColumn, RemoteDataTable } from '@app/admin/components/RemoteDataTable';
import { ShirtFit, ShirtSize, VendorGender, VendorTeam } from '@lib/database/Types';

/**
 * Props accepted by the <VendorTable> component.
 */
export interface VendorTableProps {
    /**
     * Unique slug of the event for which the table is being displayed.
     */
    event: string;

    /**
     * Name of the vendor team for which data is being shown.
     */
    team: VendorTeam;

    /**
     * Roles that can be assigned to each of the vendors.
     */
    roles: string[];
}

/**
 * The <VendorTable> displays an editable table with the details of a particular vendor team.
 */
export function VendorTable(props: VendorTableProps) {
    const context = { event: props.event, team: props.team };

    const teamSpecificColumns: RemoteDataTableColumn<VendorRowModel>[] = [];
    switch (props.team) {
        case VendorTeam.FirstAid:
            teamSpecificColumns.push({
                field: 'shirtSize',
                headerName: 'T-shirt size',
                editable: true,
                flex: 1,

                type: 'singleSelect',
                valueOptions: [ /* empty= */ ' ', ...Object.values(ShirtSize) ],
            });

            teamSpecificColumns.push({
                field: 'shirtFit',
                headerName: 'T-shirt fit',
                editable: true,
                flex: 1,

                type: 'singleSelect',
                valueOptions: [ /* empty= */ ' ', ...Object.values(ShirtFit) ],
            });

            break;
    }

    const columns: RemoteDataTableColumn<VendorRowModel>[] = [
        {
            field: 'id',
            headerName: 'ID',
            sortable: false,
            editable: false,
            width: 50,
        },
        {
            field: 'firstName',
            headerName: 'First name',
            editable: true,
            flex: 2,
        },
        {
            field: 'lastName',
            headerName: 'Last name',
            editable: true,
            flex: 2,
        },
        {
            field: 'role',
            headerName: 'Role',
            editable: true,
            flex: 2,

            type: 'singleSelect',
            valueOptions: [ /* empty= */ ' ', ...props.roles ],
        },
        {
            field: 'gender',
            headerName: 'Gender',
            editable: true,
            flex: 1,

            type: 'singleSelect',
            valueOptions: Object.values(VendorGender),
        },
        ...teamSpecificColumns,
    ];

    return (
        <RemoteDataTable columns={columns} endpoint="/api/admin/vendors" context={context}
                         enableCreate enableDelete enableUpdate refreshOnUpdate
                         defaultSort={{ field: 'firstName', sort: 'asc' }} disableFooter />
    );
}
