// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useState } from 'react';

import { type FieldValues, FormContainer, SelectElement } from 'react-hook-form-mui';

import Grid from '@mui/material/Unstable_Grid2';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import type { PageInfoWithTeam } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import type { UpdateTeamVolunteerDefinition } from '@app/api/admin/updateTeamVolunteer';
import { ApplicationParticipation } from '@app/registration/[slug]/application/ApplicationParticipation';
import { SubmitCollapse } from '@app/admin/components/SubmitCollapse';
import { issueServerAction } from '@lib/issueServerAction';

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
     * Information about the event this volunteer will participate in.
     */
    event: PageInfoWithTeam['event'];

    /**
     * Information about the team this volunteer is part of.
     */
    team: PageInfoWithTeam['team'];

    /**
     * Information about the volunteer for whom this page is being displayed.
     */
    volunteer: {
        userId: number;
        credits: number;
        preferences?: string;
        serviceHours?: number;
        preferenceTimingStart?: number;
        preferenceTimingEnd?: number;
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
            console.log(data);
            const response = await issueServerAction<UpdateTeamVolunteerDefinition>(
                '/api/admin/update-team-volunteer', {
                    userId: volunteer.userId,
                    eventId: event.id,
                    teamId: team.id,

                    application: {
                        credits: !!data.credits,
                        preferences: data.preferences,
                        serviceHours: `${data.serviceHours}` as any,
                        serviceTiming: data.serviceTiming,
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
    }, [ event.id, team.id, volunteer.userId ]);

    const serviceTiming = `${volunteer.preferenceTimingStart}-${volunteer.preferenceTimingEnd}`;
    const defaultValues = { ...volunteer, serviceTiming };

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ pb: 2 }}>
                Preferences
            </Typography>
            <FormContainer defaultValues={defaultValues} onSuccess={handleSubmit}>
                <ApplicationParticipation onChange={handleChange} />
                <Grid container spacing={2} sx={{ mt: 1 }}>
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
