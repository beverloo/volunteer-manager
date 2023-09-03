// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';
import { useCallback, useMemo } from 'react';

import type { GridRenderCellParams } from '@mui/x-data-grid';
import { default as MuiLink } from '@mui/material/Link';
import Typography from '@mui/material/Typography';

import type { ContentScope } from './ContentScope';
import type { DataTableColumn, DataTableRowRequest } from '../DataTable';
import { DataTable } from '../DataTable';
import { callApi } from '@lib/callApi';
import { dayjs } from '@lib/DateTime';

/**
 * Props accepted by the <ContentList> component.
 */
export interface ContentListProps {
    /**
     * Whether the user is allowed to request deletion of content items.
     */
    allowDelete?: boolean;

    /**
     * Enables whether the author should be a link through to their account page. Those pages are
     * not available to everyone, hence why this must be explicitly enabled.
     */
    enableAuthorLink?: boolean;

    /**
     * Prefix to display at the beginning of the content's path.
     */
    pathPrefix?: string;

    /**
     * Scope of the content that should be editable.
     */
    scope: ContentScope;
}

/**
 * The <ContentList> component displays a list of content items that already exist, each of which
 * can be edited by clicking on a cell in the data table. The actual content will be fetched from
 * the server using an API call.
 */
export function ContentList(props: ContentListProps) {
    const columns: DataTableColumn[] = useMemo(() => ([
        {
            field: 'id',
            headerName: '',
            sortable: false,
            width: 75,
        },
        {
            field: 'path',
            headerName: 'Content path',
            sortable: true,
            flex: 3,

            renderCell: (params: GridRenderCellParams) => {
                if (!props.pathPrefix)
                    return params.value;

                return (
                    <>
                        <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                            {props.pathPrefix}
                        </Typography>
                        <Typography variant="body2">
                            {params.value}
                        </Typography>
                    </>
                );
            },
        },
        {
            field: 'title',
            headerName: 'Content title',
            sortable: true,
            flex: 3,
        },
        {
            field: 'updatedOn',
            headerName: 'Last updated',
            sortable: true,
            flex: 2,

            renderCell: (params: GridRenderCellParams) => {
                return dayjs.unix(params.value).format('YYYY-MM-DD');
            },
        },
        {
            field: 'updatedBy',
            headerName: 'Author',
            sortable: true,
            flex: 3,

            renderCell: (params: GridRenderCellParams) => {
                if (!props.enableAuthorLink)
                    return params.value;

                const href = `/admin/volunteers/${params.row.updatedByUserId}`;
                return (
                    <MuiLink component={Link} href={href}>
                        {params.value}
                    </MuiLink>
                );
            },
        }
    ]), [ props.enableAuthorLink, props.pathPrefix ]);

    const fetchContent = useCallback(async (request: DataTableRowRequest) => {
        const sortItem =
            !!request.sortModel.length ? request.sortModel[0]
                                       : { field: 'path', sort: 'asc' };

        const response = await callApi('get', '/api/admin/content', {
            scope: props.scope,
            sort: sortItem /* `field` is correct= */ as any,
        });

        return {
            rowCount: response.content.length,
            rows: response.content,
        };
    }, [ props.scope ]);

    return <DataTable columns={columns} onRequestRows={fetchContent} dense
                      initialSortItem={{ field: 'path', sort: 'asc' }} />;
}
