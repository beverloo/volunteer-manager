// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { type FieldValues, FormContainer } from 'react-hook-form-mui';
import { dayjs } from '@lib/DateTime';

import LockOpenIcon from '@mui/icons-material/LockOpen';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { SubmitCollapse } from '@app/admin/components/SubmitCollapse';
import { TrainingPreferencesForm } from '@app/registration/[slug]/application/training/TrainingPreferencesForm';
import { callApi } from '@lib/callApi';

/**
 * Props accepted by the <ApplicationTrainingPreferences> component.
 */
export interface ApplicationTrainingPreferencesProps {
    /**
     * Slug of the event for which these preferences exist.
     */
    eventSlug: string;

    /**
     * Slug of the team for which the preferences exist.
     */
    teamSlug: string;

    /**
     * Options for trainings that can be presented to the user, inclusive of their label, but
     * exclusive of the "Skip" option.
     */
    trainingOptions: { id: number; label: string; }[];

    /**
     * ID of the training that the volunteer would like to participate in.
     */
    training?: { preference?: number };

    /**
     * User ID of the volunteer for whom preferences are being shown.
     */
    volunteerUserId: number;
}

/**
 * The <ApplicationTrainingPreferences> component displays information about this volunteer's
 * training preferences. Not all volunteers have to do the training, but everyone can be invited.
 */
export function ApplicationTrainingPreferences(props: ApplicationTrainingPreferencesProps) {
    const { trainingOptions, training } = props;

    const router = useRouter();

    const [ error, setError ] = useState<string | undefined>();
    const [ invalidated, setInvalidated ] = useState<boolean>(false);
    const [ loading, setLoading ] = useState<boolean>(false);

    const handleChange = useCallback(() => setInvalidated(true), [ /* no deps */ ]);
    const handleSubmit = useCallback(async (data: FieldValues) => {
        setLoading(true);
        setError(undefined);
        try {
            const response = await callApi('post', '/api/event/training-preferences', {
                environment: props.teamSlug,
                event: props.eventSlug,
                preferences: {
                    training: data.training,
                },
                adminOverrideUserId: props.volunteerUserId,
            });

            if (response.success) {
                router.refresh();
                setInvalidated(false);
            } else {
                setError(response.error);
            }
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [ props.eventSlug, props.teamSlug, props.volunteerUserId, router ]);

    const defaultValues = useMemo(() => {
        if (!training)
            return { /* no preferences */ };
        else if (training.preference === undefined)
            return { training: /* skip= */ 0 };
        else
            return { training: training.preference };
    }, [ training ]);

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
                Training preferences
                <Tooltip title="Restricted to the training management permission">
                    <LockOpenIcon color="warning" fontSize="small"
                                  sx={{ verticalAlign: 'middle', mb: 0.25, ml: 1 }} />
                </Tooltip>
            </Typography>
            <FormContainer defaultValues={defaultValues} onSuccess={handleSubmit}>
                <TrainingPreferencesForm onChange={handleChange}
                                         trainingOptions={trainingOptions} />
                <SubmitCollapse error={error} loading={loading} open={invalidated} sx={{ mt: 2 }} />
            </FormContainer>
        </Paper>
    );
}
