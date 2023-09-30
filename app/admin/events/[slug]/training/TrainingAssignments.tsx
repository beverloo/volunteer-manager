// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';

import type { GridRenderCellParams, GridValidRowModel } from '@mui/x-data-grid';
import { default as MuiLink } from '@mui/material/Link';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { type DataTableColumn, DataTable } from '@app/admin/DataTable';

/**
 * Information about an individual assignment. Volunteers must have indicated their preferences
 * before training managers are able to confirm their participation.
 */
export interface TrainingAssignment {
    /**
     * Unique ID of this training session, either "user/ID" or "extra/ID".
     */
    id: string;

    /**
     * Full name of the participant.
     */
    name: string;

    /**
     * For volunteers who participate, their unique user ID and team identity, to link them.
     */
    userId?: number;
    team?: string;

    /**
     * Their preferred training ID. `null` means that they would like to skip. `undefined` means
     * that they have not expressed their preferences yet.
     */
    preferredTrainingId: number | null | undefined;

    /**
     * Their assigned training ID. `null` means that they are allowed to skip. `undefined` means
     * that the training managers have not made a decision yet.
     */
    assignedTrainingId: number | null | undefined;

    /**
     * Whether the assignment has been confirmed, and can be communicated.
     */
    confirmed: boolean;
}

/**
 * Props accepted by the <TrainingAssignments> component.
 */
export interface TrainingAssignmentsProps {
    /**
     * The assignments that should be shown.
     */
    assignments: TrainingAssignment[];

    /**
     * Training configuration entries, which the preference/assignment options can be picked from.
     */
    trainings: { value: number; label: string; }[];
}

/**
 * The <TrainingAssignments> component displays the volunteers who are eligible to participate in
 * the training sessions, their preferences and the decided (& confirmed) assignments.
 */
export function TrainingAssignments(props: TrainingAssignmentsProps) {
    const optionsMap = useMemo(() => {
        const optionsMap = new Map<number, string>();
        for (const option of props.trainings)
            optionsMap.set(option.value, option.label);

        return optionsMap;
    }, [ props.trainings ]);

    const columns: DataTableColumn<TrainingAssignment>[] = [
        {
            field: 'name',
            headerName: 'Participant',
            editable: false,
            sortable: true,
            flex: 1,

            renderCell: (params: GridRenderCellParams<TrainingAssignment>) => {
                if (!params.row.userId || !params.row.team)
                    return params.value;

                const href = `./${params.row.team}/volunteers/${params.row.userId}`;
                return (
                    <MuiLink component={Link} href={href}>
                        {params.value}
                    </MuiLink>
                );
            },
        },
        {
            field: 'preferredTrainingId',
            headerName: 'Preference',
            editable: false,
            sortable: true,
            flex: 1,

            renderCell: (params: GridRenderCellParams<TrainingAssignment>) => {
                if (params.value === undefined) {
                    return (
                        <Tooltip title="Pending volunteer preferences">
                            <MoreHorizIcon color="warning" fontSize="small" />
                        </Tooltip>
                    );
                } else if (params.value === null) {
                    return 'Skip the training';
                }

                const label = optionsMap.get(params.value);
                return label ?? <Typography variant="overline">[unknown]</Typography>;
            },
        },
        {
            field: 'assignedTrainingId',
            headerName: 'Assignment',
            editable: true,
            sortable: true,
            flex: 1,

            renderCell: (params: GridRenderCellParams<TrainingAssignment>) => {
                if (params.value === undefined) {
                    return (
                        <Tooltip title="Pending approval">
                            <MoreHorizIcon color="warning" fontSize="small" />
                        </Tooltip>
                    );
                } else if (params.value === null) {
                    return 'Skip the training';
                }

                const label = optionsMap.get(params.value);
                return label ?? <Typography variant="overline">[unknown]</Typography>;
            },
        },
        {
            field: 'confirmed',
            headerName: 'Confirmed',
            editable: true,
            sortable: true,
            width: 100,
            type: 'boolean',

            renderCell: (params: GridRenderCellParams<TrainingAssignment>) => {
                return !!params.value ? <CheckCircleIcon fontSize="small" color="success" />
                                      : <CancelIcon fontSize="small" color="error" />;
            },
        }
    ];

    // TODO: Warnings

    return (
        <Paper sx={{ p: 2, mt: 2 }}>
            <Typography variant="h5" sx={{ pb: 1 }}>
                Training assignments
            </Typography>
            <DataTable columns={columns} rows={props.assignments}
                       pageSize={100} pageSizeOptions={[100]} disableFooter dense />
        </Paper>
    );
}
