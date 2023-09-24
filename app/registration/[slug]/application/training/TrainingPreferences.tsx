// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { type FieldValues, FormContainer } from 'react-hook-form-mui';

import Box from '@mui/material/Box';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import LoadingButton from '@mui/lab/LoadingButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { RegistrationTraining } from '@lib/Registration';
import { Markdown } from '@app/components/Markdown';
import { TrainingPreferencesForm } from './TrainingPreferencesForm';
import { callApi } from '@lib/callApi';

/**
 * Message to display to volunteers when their preferences have been marked as read-only.
 */
const kPreferencesLockedMarkdown =
    '> Great news! Your participation is confirmed, and your preferences have been locked in.';

/**
 * Props accepted by the <TrainingPreferences> component.
 */
export interface TrainingPreferencesProps {
    /**
     * Environment for which the preferences are being shown.
     */
    environment: string;

    /**
     * Slug of the event for which the preferences are being shown.
     */
    eventSlug: string;

    /**
     * Whether the form should be marked as read-only, useful in case their participation has been
     * confirmed. Changes can only be made after that by e-mailing our team.
     */
    readOnly?: boolean;

    /**
     * Information about the volunteer's training participation that we're representing.
     */
    training?: RegistrationTraining;

    /**
     * Options for trainings that can be presented to the user, inclusive of their label, but
     * exclusive of the "Skip" option.
     */
    trainingOptions: { id: number; label: string; }[];
}

/**
 * The <TrainingPreferences> component will allow a volunteer to see and modify their preferences
 * regarding participating in our professional training.
 */
export function TrainingPreferences(props: TrainingPreferencesProps) {
    const { readOnly, training, trainingOptions } = props;

    const router = useRouter();

    const [ error, setError ] = useState<string | undefined>();
    const [ loading, setLoading ] = useState<boolean>(false);
    const [ success, setSuccess ] = useState<string | undefined>();

    const handleSubmit = useCallback(async (data: FieldValues) => {
        setLoading(true);
        setError(undefined);
        setSuccess(undefined);
        try {
            if (readOnly)
                throw new Error('Your preferences have been locked in already.');

            const response = await callApi('post', '/api/event/training-preferences', {
                environment: props.environment,
                event: props.eventSlug,
                preferences: {
                    training: data.training,
                },
            });

            if (response.success) {
                setSuccess('Your preferences have been updated!');
                router.refresh();
            } else {
                setError(response.error);
            }
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [ props.environment, props.eventSlug, readOnly, router ]);

    const defaultValues = useMemo(() => {
        if (!training)
            return { /* no preferences */ };
        else if (training.preference === undefined)
            return { training: /* skip= */ 0 };
        else
            return { training: training.preference };
    }, [ training ]);

    return (
        <Box sx={{ mt: 1, mb: 2 }}>
            <Typography variant="h5" sx={ readOnly ? {} : { mb: 1 } }>
                Your training preferences
            </Typography>
            { readOnly && <Markdown sx={{ mt: -1, mb: 1 }}>{kPreferencesLockedMarkdown}</Markdown> }
            <FormContainer defaultValues={defaultValues} onSuccess={handleSubmit}>
                <TrainingPreferencesForm readOnly={readOnly} trainingOptions={trainingOptions} />
                { !readOnly &&
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ pt: 2 }}>
                        <LoadingButton startIcon={ <HistoryEduIcon /> } variant="contained"
                                       loading={loading} type="submit">
                            Update my preferences
                        </LoadingButton>
                        { success &&
                            <Typography sx={{ color: 'success.main' }}>
                                {success}
                            </Typography> }
                        { error &&
                            <Typography sx={{ color: 'error.main' }}>
                                {error}
                            </Typography> }
                    </Stack> }
            </FormContainer>
        </Box>
    );
}
