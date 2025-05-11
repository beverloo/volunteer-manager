// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';
import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import type { GridFilterModel } from '@mui/x-data-grid-pro';
import { default as MuiLink } from '@mui/material/Link';
import ReadMoreIcon from '@mui/icons-material/ReadMore';
import ReportGmailerrorredIcon from '@mui/icons-material/ReportGmailerrorred';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';

import { DataTable, type DataTableColumn } from '@app/admin/components/DataTable';
import { TeamChip } from '@app/admin/components/TeamChip';
import { callApi } from '@lib/callApi';

/**
 * Row model for each volunteer that should be displayed in the overview table.
 */
interface VolunteerRowModel {
    id: number;
    username?: string;
    firstName: string;
    lastName: string;
    displayName?: string;
    name: string;
    gender: string;
    birthdate?: string;
    phoneNumber?: string;
    teams?: string;
    activated: boolean;
}

/**
 * Props accepted by the <VolunteerDataTable> component.
 */
interface VolunteerDataTableProps {
    /**
     * Initial set of filters, provided in case the user has modified their selection.
     */
    initialFilterModel?: string;

    /**
     * Initial set of hidden fields, provided in case the user has modified their selection.
     */
    initialHiddenFields: string;

    /**
     * Information about the teams and their theme colours.
     */
    teamColours: {
        name: string;
        darkThemeColour: string;
        lightThemeColour: string;
    }[];

    /**
     * The data that should be shown in the volunteer data table.
     */
    volunteers: VolunteerRowModel[];
}

/**
 * The <VolunteerDataTable> component wraps the <DataTable> component with a few added client
 * transformation options specific to this functionality.
 */
export function VolunteerDataTable(props: VolunteerDataTableProps) {
    const kVolunteerBase = '/admin/organisation/accounts/';

    const router = useRouter();

    const teamColours = useMemo(() => {
        return new Map(props.teamColours.map(({ name, darkThemeColour, lightThemeColour }) =>
            ([ name, { dark: darkThemeColour, light: lightThemeColour } ])));

    }, [ props.teamColours ]);

    const columns: DataTableColumn<VolunteerRowModel>[] = [
        {
            field: 'id',
            display: 'flex',
            headerName: /* empty= */ '',
            sortable: false,
            width: 50,

            disableColumnMenu: true,

            renderCell: params =>
                <MuiLink component={Link} href={kVolunteerBase + params.value} sx={{ pt: '4px' }}>
                    <ReadMoreIcon color="info" />
                </MuiLink>,
        },
        {
            field: 'name',
            display: 'flex',
            headerName: 'Name',
            sortable: true,
            flex: 1,

            renderCell: params =>
                <>
                    <MuiLink component={Link} href={kVolunteerBase + params.row.id}>
                        {params.value}
                    </MuiLink>
                    { !params.row.activated &&
                        <Tooltip title="Pending activation">
                            <ReportGmailerrorredIcon color="error" fontSize="small"
                                                     sx={{ ml: 1 }} />
                        </Tooltip> }
                </>,
        },
        {
            field: 'firstName',
            headerName: 'First name',
            sortable: true,
            flex: 1,
        },
        {
            field: 'lastName',
            headerName: 'Last name',
            sortable: true,
            flex: 1,
        },
        {
            field: 'displayName',
            headerName: 'Display name',
            sortable: true,
            flex: 1,
        },
        {
            field: 'gender',
            headerName: 'Gender',
            sortable: true,
            flex: 1,
        },
        {
            field: 'birthdate',
            headerName: 'Birthdate',
            sortable: true,
            flex: 1,
        },
        {
            field: 'username',
            headerName: 'E-mail',
            sortable: true,
            flex: 1,
        },
        {
            field: 'phoneNumber',
            headerName: 'Phone number',
            sortable: true,
            flex: 1,
        },
        {
            field: 'teams',
            display: 'flex',
            headerName: 'Teams',
            sortable: false,
            flex: 1,

            renderCell: params => {
                const chips = params.value?.split(',').sort();
                if (!Array.isArray(chips))
                    return undefined;

                return (
                    <Stack direction="row" spacing={1}>
                        { chips.map((team: any, index: number) =>
                            <TeamChip key={index} label={team}
                                      colours={teamColours.get(team)!} /> ) }
                    </Stack>
                );
            },
        },
    ];

    // ---------------------------------------------------------------------------------------------
    // Column visibility management:
    // ---------------------------------------------------------------------------------------------

    const hiddenFields = useMemo(() => {
        return props.initialHiddenFields.split(',') as (keyof VolunteerRowModel)[];
    }, [ props.initialHiddenFields ]);

    const handleColumnChange = useCallback((model: Record<string, boolean>) => {
        const hiddenFields: string[] = [];
        for (const [ field, state ] of Object.entries(model)) {
            if (!state)
                hiddenFields.push(field);
        }

        // Opportunistically update the user setting:
        callApi('post', '/api/auth/settings', {
            'user-admin-volunteers-columns-hidden': hiddenFields.join(','),
        }).then(() => router.refresh());

    }, [ router ]);

    // ---------------------------------------------------------------------------------------------
    // Data filtering management:
    // ---------------------------------------------------------------------------------------------

    const initialFilters = useMemo(() => {
        if (!props.initialFilterModel)
            return undefined;

        try {
            return JSON.parse(props.initialFilterModel) as GridFilterModel;
        } catch (error: any) {
            console.error(`Invalid filter model stored: ${props.initialFilterModel}`);
        }

        return undefined;

    }, [ props.initialFilterModel ]);

    const handleFilterChange = useCallback((model: GridFilterModel) => {
        // Don't store the `quickFilterValues` property, as search results should be ephemeral.
        if (Object.hasOwn(model, 'quickFilterValues'))
            model = { ...model, quickFilterValues: undefined };

        // Opportunistically update the user setting:
        callApi('post', '/api/auth/settings', {
            'user-admin-volunteers-columns-filter': JSON.stringify(model),
        }).then(() => router.refresh());

    }, [ router ]);

    // ---------------------------------------------------------------------------------------------

    return <DataTable columns={columns} rows={props.volunteers} enableFilter pageSize={25}
                      defaultSort={{ field: 'name', sort: 'asc' }} enableColumnMenu
                      hiddenFields={hiddenFields} onColumnVisibilityModelChange={handleColumnChange}
                      initialFilters={initialFilters} onFilterModelChange={handleFilterChange} />;
}
