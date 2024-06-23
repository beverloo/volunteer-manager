// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import type { EventTeamRowModel } from '@app/api/admin/event/teams/[[...id]]/route';
import type { PageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import { RemoteDataTable, type RemoteDataTableColumn } from '@app/admin/components/RemoteDataTable';

/**
 * Props accepted by the <EventParticipatingTeams> component.
 */
export interface EventParticipatingTeamsProps {
    /**
     * Information about the event whose settings are being changed.
     */
    event: PageInfo['event'];
}

/**
 * The <EventParticipatingTeams> component allows event administrators to change settings regarding
 * the individual teams that take part in this particular event. Enabling participation of a team
 * will enable a more detailed section with settings specific to that team.
 */
export function EventParticipatingTeams(props: EventParticipatingTeamsProps) {
    const { event } = props;

    const context = { event: props.event.slug };
    const columns: RemoteDataTableColumn<EventTeamRowModel>[] = [
        {
            field: 'enableTeam',
            headerAlign: 'center',
            headerName: '',
            editable: true,
            sortable: false,
            type: 'boolean',
            align: 'center',
            width: 50,

            renderCell: params => {
                return !!params.value ? <CheckCircleIcon fontSize="small" color="success" />
                                      : <CancelIcon fontSize="small" color="error" />;
            },
        },
        {
            field: 'name',
            headerName: 'Team',
            editable: false,
            sortable: false,
            flex: 2,
        },
        {
            field: 'targetSize',
            headerName: 'Target # volunteers',
            headerAlign: 'center',
            description: 'How many volunteers will we ideally recruit?',
            align: 'center',
            editable: true,
            sortable: false,
            type: 'number',
            flex: 1,
        },
        {
            field: 'maximumSize',
            headerName: 'Maximum # volunteers',
            headerAlign: 'center',
            description: 'After how many volunteers will applications lock?',
            align: 'center',
            editable: true,
            sortable: false,
            type: 'number',
            flex: 1,
        },
        {
            field: 'whatsappLink',
            headerName: 'WhatsApp invite',
            description: 'WhatsApp group invite to share with the team',
            editable: true,
            sortable: false,
            type: 'string',
            flex: 2,
        },
    ];

    return (
        <RemoteDataTable columns={columns} endpoint="/api/admin/event/teams" context={context}
                         enableUpdate defaultSort={{ field: 'name', sort: 'asc' }}
                         disableFooter />
    );
}
