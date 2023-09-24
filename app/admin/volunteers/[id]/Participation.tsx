// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';

import type { GridRenderCellParams } from '@mui/x-data-grid';
import { default as MuiLink } from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import { type DataTableColumn, DataTable } from '@app/admin/DataTable';
import { TeamChip } from '@app/admin/components/TeamChip';
import type { RegistrationStatus } from '@lib/database/Types';

/**
 * Information about a volunteer's participation in a singular event.
 */
export interface ParticipationInfo {
    /**
     * Unique ID describing this participation.
     */
    id: number;

    /**
     * Name of the event during which they participated.
     */
    eventShortName: string;

    /**
     * Slug of the event, to enable deep linking to their participation.
     */
    eventSlug: string;

    /**
     * Status of their participation, one of { Registered, Accepted, Rejected, Cancelled }.
     */
    status: string;

    /**
     * Name of the team in which they participated.
     */
    team: string;

    /**
     * Slug of the team in which they participated, also to enable deep linking.
     */
    teamSlug: string;

    /**
     * Dark theme colour that applies to this team.
     */
    teamDarkThemeColour: string;

    /**
     * Light theme colour that applies to this team.
     */
    teamLightThemeColour: string;

    /**
     * Name of the role in which they participated.
     */
    role: string;
}

/**
 * Props accepted by the <Participation> component.
 */
export interface ParticipationProps {
    /**
     * Information about the participation as it should be rendered.
     */
    participation: ParticipationInfo[];

    /**
     * ID of the user for whom participation is being displayed.
     */
    userId: number;
}

/**
 * The <Participation> component lists the events in which this volunteer has participated, and in
 * which role. This may include cancelled participation.
 */
export function Participation(props: ParticipationProps) {
    const { participation, userId } = props;

    const columns: DataTableColumn[] = [
        {
            field: 'eventShortName',
            headerName: 'Event',
            flex: 2,

            renderCell: (params: GridRenderCellParams) => {
                const { eventSlug, status, teamSlug } = params.row;

                let href: string = '#';
                switch (status as RegistrationStatus) {
                    case 'Registered':
                    case 'Rejected':
                        href = `/admin/events/${eventSlug}/${teamSlug}/applications`;
                        break;

                    case 'Accepted':
                    case 'Cancelled':
                        href = `/admin/events/${eventSlug}/${teamSlug}/volunteers/${userId}`;
                        break;
                }

                return (
                    <MuiLink component={Link} href={href}>
                        {params.value}
                    </MuiLink>
                );
            },
        },
        {
            field: 'status',
            headerName: 'Status',
            flex: 1,
        },
        {
            field: 'team',
            headerName: 'Team',
            flex: 1,

            renderCell: (params: GridRenderCellParams) =>
                <TeamChip label={params.value}
                          colours={{
                              dark: params.row.teamDarkThemeColour,
                              light: params.row.teamLightThemeColour,
                          }} />,
        },
        {
            field: 'role',
            headerName: 'Role',
            flex: 1,
        }
    ];

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ pb: 1 }}>
                Participation
            </Typography>
            <DataTable dense disableFooter rows={participation} columns={columns} />
        </Paper>
    );
}
