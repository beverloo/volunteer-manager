// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';

import { default as MuiChip } from '@mui/material/Chip';
import { default as MuiLink } from '@mui/material/Link';

import { Chip } from '../../components/Chip';
import { DataTable, type DataTableColumn } from '@app/admin/components/DataTable';

/**
 * Props accepted by the <TeamsDataTable> component.
 */
interface TeamsDataTableProps {
    /**
     * Array containing all teams known to the Volunteer Manager.
     */
    teams: {
        /**
         * Unique ID of the team as it exists in the database. Required by <DataTable>.
         */
        id: number;

        /**
         * URL-safe slug through which the team is identifiable through a URL.
         */
        slug: string;

        /**
         * Title of the team, as it should be presented in print.
         */
        title: string;

        /**
         * Name of the team, as it should be presented in brief.
         */
        name: string;

        /**
         * RGB colour that indicates this team. Will be used on their badge.
         */
        color: string;

        /**
         * Domain name through which this team's schedules are served. The team has been orphaned
         * when no domain name is given, which can happen when an environment was removed.
         */
        domain?: string;
    }[];
}

/**
 * The <TeamsDataTable> component displays the teams that are known to the Volunteer Manager. This
 * interface is read-only, and teams cannot be created through this Data Table.
 */
export function TeamsDataTable(props: TeamsDataTableProps) {
    const columns: DataTableColumn<TeamsDataTableProps['teams'][number]>[] = [
        {
            field: 'title',
            headerName: 'Team',
            sortable: true,
            flex: 1,

            renderCell: params =>
                <MuiLink component={Link} href={`/admin/organisation/teams/${params.row.slug}`}>
                    {params.value}
                </MuiLink>,
        },
        {
            field: 'domain',
            headerName: 'Domain',
            sortable: true,
            flex: 1,

            renderCell: params => {
                if (!params.value) {
                    return <MuiChip color="error" size="small" label="no domain" />;
                }

                return (
                    <MuiLink component={Link} href={`https://${params.value}`} target="_blank">
                        {params.value}
                    </MuiLink>
                );
            },
        },
        {
            field: 'name',
            headerName: 'Badge',
            sortable: false,
            flex: 1,

            renderCell: params =>
                <Chip color={params.row.color} label={params.value} />,
        },
    ];

    return (
        <DataTable columns={columns} rows={props.teams} disableFooter
                   defaultSort={{ field: 'title', sort: 'asc' }} pageSize={25} />
    );
}
