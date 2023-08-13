// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import type { DataTableBaseProps, DataTableColumn } from '@app/admin/DataTable';
import type { DataTableRowRequest, DataTableRowResponse } from '@app/admin/DataTable';
import type { LogsDefinition } from '@app/api/admin/logs';
import { DataTable } from '../DataTable';
import { issueServerAction } from '@app/lib/issueServerAction';

/**
 * Props made available to the <LogsDataTable> component.
 */
export interface LogsDataTableProps extends DataTableBaseProps {}

/**
 * The <LogsDataTable> component populates the client-side table with the necessary functions to
 * transform the data and add interaction where applicable.
 */
export function LogsDataTable(props: LogsDataTableProps) {
    const columns: DataTableColumn[] = [
        {
            field: 'message',
            headerName: 'Message',
            sortable: false,
            flex: 1,
        },
    ];

    async function onRequestRows(request: DataTableRowRequest): Promise<DataTableRowResponse> {
        return await issueServerAction<LogsDefinition>('/api/admin/logs', {
            page: request.page,
            pageSize: request.pageSize,
        });
    }

    return (
        <DataTable {...props} onRequestRows={onRequestRows} columns={columns} />
    );
}
