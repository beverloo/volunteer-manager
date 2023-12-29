// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import React, { useCallback, useState } from 'react';

import { type FieldValues, AutocompleteElement, FormContainer } from 'react-hook-form-mui';

import Grid from '@mui/material/Unstable_Grid2';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import type { EventTimeslotEntry } from '@app/registration/[slug]/application/availability/getPublicEventsForFestival';
import { ApplicationAvailabilityForm } from '@app/registration/[slug]/application/ApplicationParticipation';
import { SubmitCollapse } from '@app/admin/components/SubmitCollapse';
import { callApi } from '@lib/callApi';

/**
 * Props accepted by the <ApplicationAvailability> component.
 */
export interface ApplicationAvailabilityProps {
    /**
     * Slug of the event for which application metadata is being shown.
     */
    event: string;

    /**
     * The list of public events that can be selected as wanting to attend.
     */
    events: EventTimeslotEntry[];

    /**
     * Slug of the team that this application is part of.
     */
    team: string;

    /**
     * Information about the volunteer for whom this page is being displayed.
     */
    volunteer: {
        userId: number;
        actualAvailableEventLimit: number;
        availabilityTimeslots?: string;
        preferences?: string;
        serviceHours?: number;
        preferenceTimingStart?: number;
        preferenceTimingEnd?: number;
    }
}

/**
 * The <ApplicationAvailability> component displays the volunteer's availability information and
 * allows the senior to modify it. All modifications will be logged.
 */
export function ApplicationAvailability(props: ApplicationAvailabilityProps) {
    const { event, team, volunteer } = props;

    const [ error, setError ] = useState<string>();
    const [ invalidated, setInvalidated ] = useState<boolean>(false);
    const [ loading, setLoading ] = useState<boolean>(false);

    const handleChange = useCallback(() => setInvalidated(true), [ /* no deps */ ]);
    const handleSubmit = useCallback(async (data: FieldValues) => {
        setLoading(true);
        try {
            const eventPreferences: number[] = [];
            for (let index = 0; index < volunteer.actualAvailableEventLimit; ++index) {
                if (!Object.hasOwn(data, `preference_${index}`))
                    continue;  // no value has been set

                const timeslotId = data[`preference_${index}`];
                if (typeof timeslotId === 'number' && !Number.isNaN(timeslotId)) {
                    if (!eventPreferences.includes(timeslotId))
                        eventPreferences.push(timeslotId);
                }
            }

            const response = await callApi('post', '/api/event/availability-preferences', {
                environment: team,
                event: event,
                eventPreferences: eventPreferences,
                preferences: data.preferences,
                serviceHours: `${data.serviceHours}` as any,
                serviceTiming: data.serviceTiming,
                adminOverrideUserId: volunteer.userId,
            });

            if (response.success)
                setInvalidated(false);
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [ event, team, volunteer.actualAvailableEventLimit, volunteer.userId ]);

    const serviceTiming = `${volunteer.preferenceTimingStart}-${volunteer.preferenceTimingEnd}`;
    const defaultValues: Record<string, any> = {
        ...volunteer,
        serviceTiming
    };

    if (volunteer.availabilityTimeslots && volunteer.availabilityTimeslots.length > 2) {
        volunteer.availabilityTimeslots.split(',').map((timeslotId, index) => {
            defaultValues[`preference_${index}`] = parseInt(timeslotId, 10);
        });
    }

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ pb: 2 }}>
                Availability preferences
            </Typography>
            <FormContainer defaultValues={defaultValues} onSuccess={handleSubmit}>
                <Grid container spacing={2}>
                    <ApplicationAvailabilityForm onChange={handleChange} />
                    { [ ...Array(volunteer.actualAvailableEventLimit) ].map((_, index) =>
                        <Grid key={index} xs={12}>
                            <AutocompleteElement name={`preference_${index}`}
                                                 autocompleteProps={{
                                                     fullWidth: true,
                                                     onChange: handleChange,
                                                     size: 'small',
                                                 }}
                                                 options={props.events} matchId />
                        </Grid> )}
                </Grid>
                <SubmitCollapse error={error} open={invalidated} loading={loading} sx={{ mt: 2 }} />
            </FormContainer>
        </Paper>
    );
}
