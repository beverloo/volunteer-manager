// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import CatchingPokemonIcon from '@mui/icons-material/CatchingPokemon';
import CategoryIcon from '@mui/icons-material/Category';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import type { ContentCategoriesRowModel } from '@app/api/admin/content/categories/[[...id]]/route';
import { ExpandableSection } from '@app/admin/components/ExpandableSection';
import { KnowledgeBaseIcon, kKnowledgeBaseIconTable } from '@components/KnowledgeBaseIcon';
import { RemoteDataTable, type RemoteDataTableColumn } from '@app/admin/components/RemoteDataTable';

/**
 * Props accepted by the <KnowledgeCategories> component.
 */
interface KnowledgeCategoriesProps {
    /**
     * Whether the section should be expanded by default.
     */
    defaultExpanded?: boolean;

    /**
     * Unique slug of the event for which the categories are being shown.
     */
    event: string;
}

/**
 * The <KnowledgeCategories> component allows management of the knowledge categories, which indicate
 * how volunteers will find their way to the appropriate answer.
 */
export function KnowledgeCategories(props: KnowledgeCategoriesProps) {
    const { defaultExpanded, event } = props;

    const columns: RemoteDataTableColumn<ContentCategoriesRowModel>[] = [
        {
            field: 'id',
            headerName: /* no header= */ '',
            editable: false,
            sortable: false,
            width: 50,
        },
        {
            display: 'flex',
            field: 'icon',
            headerAlign: 'center',
            headerName: /* empty= */ '',
            align: 'center',
            editable: true,
            sortable: false,
            width: 100,

            type: 'singleSelect',
            valueOptions: Object.keys(kKnowledgeBaseIconTable).sort().map(
                icon => ({ value: icon, label: icon })),

            renderHeader: () =>
                <Tooltip title="Icon used for this category">
                    <CatchingPokemonIcon fontSize="small" color="primary" />
                </Tooltip>,

            renderCell: params =>
                <KnowledgeBaseIcon variant={params.value} fontSize="small" color="primary" />,
        },
        {
            field: 'title',
            headerName: 'Title',
            editable: true,
            sortable: true,
            flex: 1,
        },
        {
            field: 'description',
            headerName: 'Description',
            editable: true,
            sortable: false,
            flex: 2,

            renderCell: params => {
                if (!!params.value)
                    return params.value;

                return (
                    <Typography component="span" variant="body2"
                                sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                        No description…
                    </Typography>
                );
            },
        },
    ];

    return (
        <ExpandableSection defaultExpanded={defaultExpanded}
                           setting="user-admin-knowledge-expand-categories"
                           icon={ <CategoryIcon color="info" /> } title="Categories">

            <RemoteDataTable columns={columns} endpoint="/api/admin/content/categories"
                             context={{ event }} defaultSort={{ field: 'order', sort: 'asc' }}
                             refreshOnUpdate pageSize={100} disableFooter subject="category"
                             enableCreate enableDelete enableReorder enableUpdate />

        </ExpandableSection>
    );
}
