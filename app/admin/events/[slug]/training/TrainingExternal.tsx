// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback } from 'react';

import type { GridRenderCellParams, GridValidRowModel } from '@mui/x-data-grid';
import Alert from '@mui/material/Alert';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import type { PageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import type { TrainingExtraDefinition } from '@app/api/admin/trainingExtra';
import { type DataTableColumn, OLD_DataTable } from '@app/admin/DataTable';
import { dayjs } from '@lib/DateTime';
import { issueServerAction } from '@lib/issueServerAction';

/**
 * Configuration options available for extra training participants.
 */
export interface TrainingExternalEntry {
    /**
     * Unique ID of this entry in the training configuration.
     */
    id: number;

    /**
     * Name of the participant who would like to join.
     */
    trainingExtraName?: string;

    /**
     * E-mail address of the participant who would like to join.
     */
    trainingExtraEmail?: string;

    /**
     * Date of birth of the participant, which we need for certification purposes.
     */
    trainingExtraBirthdate?: string;

    /**
     * Preferred training session that this volunteer would like to participate in, if any.
     */
    preferenceTrainingId?: number;

    /**
     * Date on which the preference was updated, if any.
     */
    preferenceUpdated?: string;
}

/**
 * Props accepted by the <TrainingExternal> component.
 */
export interface TrainingExternalProps {
    /**
     * Information about the event for which extra training participants are being shown.
     */
    event: PageInfo['event'];

    /**
     * The extra training participants that can be displayed by this component.
     */
    participants: TrainingExternalEntry[];

    /**
     * The trainings that are available for the external folks to participate in.
     */
    trainings: { value: number; label: string; }[];
}

/**
 * The <TrainingExternal> component displays the extra people who may want to join in the training
 * sessions, outside of the volunteers we have within our team.
 */
export function TrainingExternal(props: TrainingExternalProps) {
    const { event } = props;

    async function commitAdd(): Promise<TrainingExternalEntry> {
        const response = await issueServerAction<TrainingExtraDefinition>(
            '/api/admin/training-extra', {
                event: event.slug,
                create: { /* empty payload */ }
            });

        if (!response.id)
            throw new Error('The server was unable to create a new participant.');

        return {
            id: response.id,
            trainingExtraName: '',
            trainingExtraEmail: '',
            trainingExtraBirthdate: dayjs().format('YYYY-MM-DD'),
            preferenceTrainingId: undefined,
            preferenceUpdated: undefined,
        };
    }

    async function commitDelete(oldRow: GridValidRowModel) {
        await issueServerAction<TrainingExtraDefinition>('/api/admin/training-extra', {
            event: event.slug,
            delete: {
                id: oldRow.id,
            },
        });
    }

    const commitEdit = useCallback(async (newRow: GridValidRowModel, oldRow: GridValidRowModel) => {
        const response = await issueServerAction<TrainingExtraDefinition>(
            '/api/admin/training-extra', {
                event: event.slug,
                update: {
                    id: oldRow.id,
                    trainingExtraName: newRow.trainingExtraName,
                    trainingExtraEmail: newRow.trainingExtraEmail,
                    trainingExtraBirthdate: newRow.trainingExtraBirthdate,
                    preferenceTrainingId: newRow.preferenceTrainingId,
                }
            });

        if (!response.success)
            return oldRow;

        const copiedRow = newRow;
        if (!!newRow.preferenceTrainingId)
            copiedRow.preferenceUpdated = new Date();
        else
            copiedRow.preferenceUpdated = undefined;

        return copiedRow;

    }, [ event.slug ]);

    const columns: DataTableColumn[] = [
        {
            field: 'id',
            headerName: /* empty= */ '',
            sortable: false,
            width: 50,
        },
        {
            field: 'trainingExtraName',
            headerName: 'Full name',
            editable: true,
            sortable: true,
            flex: 1,
        },
        {
            field: 'trainingExtraEmail',
            headerName: 'E-mail address',
            editable: true,
            sortable: true,
            flex: 1,
        },
        {
            field: 'trainingExtraBirthdate',
            headerName: 'Birthdate',
            editable: true,
            sortable: true,
            flex: 1,

            renderCell: (params: GridRenderCellParams) => dayjs(params.value).format('YYYY-MM-DD'),
        },
        {
            field: 'preferenceTrainingId',
            headerName: 'Preference',
            editable: true,
            sortable: true,
            flex: 1,

            type: 'singleSelect',
            valueOptions: props.trainings,

            renderCell: (params: GridRenderCellParams) => {
                if (!params.row.preferenceUpdated) {
                    return (
                        <Tooltip title="Pending preferences">
                            <MoreHorizIcon color="warning" fontSize="small" />
                        </Tooltip>
                    );
                } else if (!params.row.preferenceTrainingId) {
                    return 'Skip the training';
                }

                for (const option of props.trainings) {
                    if (option.value === params.row.preferenceTrainingId)
                        return option.label;
                }

                return <Typography variant="overline">[unknown]</Typography>;
            },
        }
    ];

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ pb: 1 }}>
                Extra participants
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
                This table enables you to add people who would like to participate in the training
                sessions, but are not part of our teams.
            </Alert>
            <OLD_DataTable commitAdd={commitAdd} commitDelete={commitDelete} commitEdit={commitEdit}
                           messageSubject="participant" rows={props.participants} columns={columns}
                           disableFooter dense />
        </Paper>
    );
}
