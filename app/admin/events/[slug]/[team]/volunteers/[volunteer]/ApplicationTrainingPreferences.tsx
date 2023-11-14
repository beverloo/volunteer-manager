// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import { type FieldValues, FormContainer, useForm } from 'react-hook-form-mui';
import Paper from '@mui/material/Paper';

import { PaperHeader } from '@app/admin/components/PaperHeader';
import { SubmitCollapse } from '@app/admin/components/SubmitCollapse';
import { TrainingPreferencesForm } from '@app/registration/[slug]/application/training/TrainingPreferencesForm';
import { callApi } from '@lib/callApi';
import { Privilege } from '@lib/auth/Privileges';

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
    const form = useForm({
        defaultValues: {
            ...(!training ? {}
                          : (training.preference === undefined ? { training: /* skip= */ 0 }
                                                               : { training: training.preference }))
        },
    });

    const [ error, setError ] = useState<string | undefined>();
    const [ invalidated, setInvalidated ] = useState<boolean>(false);
    const [ loading, setLoading ] = useState<boolean>(false);

    const handleClear = useCallback(async () => {
        const response = await callApi('post', '/api/event/training-preferences', {
            environment: props.teamSlug,
            event: props.eventSlug,
            preferences: /* clear= */ false,
            adminOverrideUserId: props.volunteerUserId,
        });

        if (!response.success)
            return { error: response.error ?? 'Unable to clear the refund request' };

        form.reset({ training: null! });
        return true;

    }, [ form, props.eventSlug, props.teamSlug, props.volunteerUserId ]);

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

    return (
        <Paper sx={{ p: 2 }}>
            <PaperHeader title="Training preferences" privilege={Privilege.EventTrainingManagement}
                         onClear={handleClear} subject="training preferences" sx={{ mb: 2 }} />
            <FormContainer formContext={form} onSuccess={handleSubmit}>
                <TrainingPreferencesForm onChange={handleChange}
                                         trainingOptions={trainingOptions} />
                <SubmitCollapse error={error} loading={loading} open={invalidated} sx={{ mt: 2 }} />
            </FormContainer>
        </Paper>
    );
}
