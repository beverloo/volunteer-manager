// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { GridRenderCellParams } from '@mui/x-data-grid';
import { default as MuiLink } from '@mui/material/Link';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import IconButton from '@mui/material/IconButton';
import ReadMoreIcon from '@mui/icons-material/ReadMore';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import type { ContentScope } from './ContentScope';
import type { DataTableColumn, DataTableRowRequest } from '../DataTable';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { OLD_DataTable } from '../DataTable';
import { callApi } from '@lib/callApi';
import { dayjs } from '@lib/DateTime';

/**
 * Props accepted by the <ContentList> component.
 */
export interface ContentListProps {
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
    const router = useRouter();

    const [ confirmationOpen, setConfirmationOpen ] = useState<boolean>(false);
    const [ confirmationSubject, setConfirmationSubject ] =
        useState<{ id: number, path: string } | undefined>();

    const handleDelete = useCallback(async () => {
        if (!confirmationOpen || !confirmationSubject)
            return true;  // no content subject has been selected for deletion.

        const response = await callApi('delete', '/api/admin/content/:id', {
            id: confirmationSubject.id,
            scope: props.scope,
        });

        if (!response.success)
            return { error: 'The server was not able to delete the content.' };

        router.refresh();
        return true;

    }, [ confirmationOpen, confirmationSubject, props.scope, router ]);

    const requestDeleteClose = useCallback(() => setConfirmationOpen(false), [ /* no deps */ ]);
    const requestDelete = useCallback(async (params: GridRenderCellParams) => {
        if (!!params.row.protected || confirmationOpen)
            return;  // protected rows cannot be deleted

        setConfirmationOpen(true);
        setConfirmationSubject({
            id: params.row.id,
            path: `${props.pathPrefix}${params.row.path}`,
        });
    }, [ confirmationOpen, props.pathPrefix ]);

    const columns: DataTableColumn[] = useMemo(() => ([
        {
            field: 'id',
            headerName: '',
            sortable: false,
            width: 85,

            renderCell: (params: GridRenderCellParams) => {
                const href = `./content/${params.row.id}`;
                return (
                    <Stack direction="row" spacing={0} alignItems="center">
                        <IconButton LinkComponent={Link} href={href} size="small">
                            <Tooltip title="View page">
                                <ReadMoreIcon fontSize="small" color="info" />
                            </Tooltip>
                        </IconButton>
                        { !params.row.protected &&
                            <IconButton size="small" onClick={ () => requestDelete(params) }>
                                <Tooltip title="Delete page">
                                    <DeleteForeverIcon fontSize="small" color="error" />
                                </Tooltip>
                            </IconButton> }
                        { !!params.row.protected &&
                            <Tooltip title="This page cannot be deleted">
                                <DeleteForeverIcon fontSize="small" color="disabled"
                                                   sx={{ ml: '5px' }} />
                            </Tooltip>}
                    </Stack>
                );
            },
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

            renderCell: (params: GridRenderCellParams) => {
                const href = `./content/${params.row.id}`;
                return (
                    <MuiLink component={Link} href={href}>
                        {params.value}
                    </MuiLink>
                );
            },
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
    ]), [ props.enableAuthorLink, props.pathPrefix, requestDelete ]);

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

    return (
        <>
            <OLD_DataTable columns={columns} onRequestRows={fetchContent} dense disableFooter
                           initialSortItem={{ field: 'path', sort: 'asc' }} />
            <ConfirmationDialog onClose={requestDeleteClose} onConfirm={handleDelete}
                                open={confirmationOpen}
                                title="Are you sure you want to delete this?">
                <Typography>
                    Deleting <strong> {confirmationSubject?.path}</strong> cannot be reverted, are
                    you sure that you want to do this? It will immediately become unavailable.
                </Typography>
            </ConfirmationDialog>
        </>
    );
}
