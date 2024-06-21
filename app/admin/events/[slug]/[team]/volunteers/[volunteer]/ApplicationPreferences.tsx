// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useState } from 'react';

import { type FieldValues, FormContainer, SelectElement } from '@proxy/react-hook-form-mui';

import Grid from '@mui/material/Unstable_Grid2';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import { ApplicationParticipationForm } from '@app/registration/[slug]/application/ApplicationParticipation';
import { SubmitCollapse } from '@app/admin/components/SubmitCollapse';
import { callApi } from '@lib/callApi';

/**
 * Options for a binary select box. They look better on the page than checkboxes.
 */
const kSelectOptions = [
    { id: 1, label: 'Yes' },
    { id: 0, label: 'No' },
];

/**
 * Props accepted by the <ApplicationPreferences> component.
 */
export interface ApplicationPreferencesProps {
    /**
     * Slug of the event for which application metadata is being shown.
     */
    event: string;

    /**
     * Slug of the team that this application is part of.
     */
    team: string;

    /**
     * Information about the volunteer for whom this page is being displayed.
     */
    volunteer: {
        userId: number;
        credits: number;
        socials: number;
        tshirtFit?: string;
        tshirtSize?: string;
    }
}

/**
 * The <ApplicationPreferences> component displays the application information the user entered when
 * they requested to join the team, which can be editted by volunteers with access to this page.
 */
export function ApplicationPreferences(props: ApplicationPreferencesProps) {
    const { event, team, volunteer } = props;

    const [ error, setError ] = useState<string>();
    const [ invalidated, setInvalidated ] = useState<boolean>(false);
    const [ loading, setLoading ] = useState<boolean>(false);

    const handleChange = useCallback(() => setInvalidated(true), [ /* no deps */ ]);
    const handleSubmit = useCallback(async (data: FieldValues) => {
        setLoading(true);
        try {
            const response = await callApi('put', '/api/application/:event/:team/:userId', {
                event,
                team,
                userId: volunteer.userId,

                data: {
                    credits: !!data.credits,
                    socials: !!data.socials,
                    tshirtFit: data.tshirtFit,
                    tshirtSize: data.tshirtSize,
                },
            });

            if (response.success)
                setInvalidated(false);
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [ event, team, volunteer.userId ]);

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ pb: 2 }}>
                Preferences
            </Typography>
            <FormContainer defaultValues={volunteer} onSuccess={handleSubmit}>
                <Grid container spacing={2}>
                    <ApplicationParticipationForm onChange={handleChange} />
                    <Grid xs={6}>
                        <SelectElement name="credits" label="Include on the credit reel?"
                                       options={kSelectOptions} size="small" fullWidth
                                       onChange={handleChange} />
                    </Grid>
                    <Grid xs={6}>
                        <SelectElement name="socials" label="Include on WhatsApp/social channels?"
                                       options={kSelectOptions} size="small" fullWidth
                                       onChange={handleChange} />
                    </Grid>
                </Grid>
                <SubmitCollapse error={error} open={invalidated} loading={loading} sx={{ mt: 2 }} />
            </FormContainer>
        </Paper>
    );
}
