// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import React, { useCallback, useMemo, useState } from 'react';

import { type FieldValues, AutocompleteElement, FormContainer, TextFieldElement,
    TextareaAutosizeElement } from 'react-hook-form-mui';

import Box from '@mui/material/Box';
import EventNoteIcon from '@mui/icons-material/EventNote';
import Grid from '@mui/material/Unstable_Grid2';
import LoadingButton from '@mui/lab/LoadingButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { callApi } from '@lib/callApi';

/**
 * Function used to generate the ordinal belonging to a particular number.
 * @see https://stackoverflow.com/a/39466341
 */
const kOrdinalFn = (n: number) => [ 'st', 'nd', 'rd' ][ ((n + 90) % 100 - 10) % 10 - 1 ] || 'th';

/**
 * Individual event that can be selected as a preference by the volunteer.
 */
export interface EventEntry {
    /**
     * Unique ID of the event that the volunteer can choose from.
     */
    id: number;

    /**
     * Label that should be displayed for this event in an autocomplete box.
     */
    label: string;
}

/**
 * Props accepted by the <AvailabilityPreferences> component.
 */
export interface AvailabilityPreferencesProps {
    /**
     * Name of the environment describing the team the volunteer is part of.
     */
    environment: string;

    /**
     * Slug of the event for which preferences are being displayed.
     */
    eventSlug: string;

    /**
     * Events that exist in the program. Only public events should be listed.
     */
    events: EventEntry[];

    /**
     * Maximum number of options to display to the volunteer.
     */
    limit: number;

    /**
     * Whether the preferences are locked. This generally is the case when we're too close to the
     * event and changes to the schedule should not be made anymore.
     */
    locked?: boolean;

    /**
     * The volunteer's current availability preferences, if any.
     */
    preferences?: string;

    /**
     * Events that the volunteer has so far selected as wanting to attend.
     */
    selection: number[];
}

/**
 * The <AvailabilityPreferences> component enables volunteers to indicate which events they really
 * want to attend. Each volunteer has a set maximum number of events to "reserve".
 */
export function AvailabilityPreferences(props: AvailabilityPreferencesProps) {
    const [ error, setError ] = useState<string | undefined>();
    const [ loading, setLoading ] = useState<boolean>(false);
    const [ success, setSuccess ] = useState<string | undefined>();

    const handleSavePreferences = useCallback(async (data: FieldValues) => {
        setError(undefined);
        setLoading(true);
        setSuccess(undefined);
        try {
            if (props.locked)
                throw new Error('Please e-mail us for any further changes!');

            const eventPreferences: number[] = [];
            for (let index = 0; index < props.limit; ++index) {
                if (!Object.hasOwn(data, `preference_${index}`))
                    continue;  // no value has been set

                const eventId = data[`preference_${index}`];
                if (typeof eventId === 'number' && !Number.isNaN(eventId))
                    eventPreferences.push(eventId);
            }

            const response = await callApi('post', '/api/event/availability-preferences', {
                environment: props.environment,
                event: props.eventSlug,
                eventPreferences,
                preferences: data.preferences,
            });

            if (response.success)
                setSuccess('Your preferences have been saved!');
            else
                setError(response.error ?? 'Your preferences could not be saved!');
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [ props.environment, props.eventSlug, props.limit, props.locked ]);

    const defaultValues = useMemo(() => ({
        preferences: props.preferences,
        ...Object.fromEntries(props.selection.map((value, index) =>
            [ `preference_${index}`, value ])),
    }), [ props.preferences, props.selection ]);

    return (
        <FormContainer defaultValues={defaultValues} onSuccess={handleSavePreferences}>
            <Box sx={{ my: 1 }}>
                <Typography variant="h5">
                    When will you be around?
                </Typography>
                <Stack direction="column" spacing={2} sx={{ mt: 2, mb: 2 }}>
                    { /* TODO: SelectElement for shift timing */ }
                    <TextareaAutosizeElement label="Anything we should know about?" fullWidth
                                             size="small" name="preferences"
                                             disabled={!!props.locked} />
                </Stack>
            </Box>

            { props.limit > 0 &&
                <Box sx={{ my: 1 }}>
                    <Typography variant="h5">
                        Events that you want to attend
                    </Typography>
                    <Grid container spacing={2} sx={{ mt: 1, mb: 2 }}>
                        { [ ...Array(props.limit) ].map((_, index) =>
                            <React.Fragment key={index}>
                                <Grid xs={12} sm={4} md={3} lg={2} alignSelf="center">
                                    {index + 1}{kOrdinalFn(index + 1)} preference
                                </Grid>
                                <Grid xs={12} sm={8} md={9} lg={10}>
                                    <AutocompleteElement name={`preference_${index}`}
                                                         autocompleteProps={{
                                                             disabled: !!props.locked,
                                                             fullWidth: true,
                                                             size: 'small',
                                                         }}
                                                         options={props.events} matchId />
                                </Grid>
                            </React.Fragment> )}
                    </Grid>
                </Box> }
            { !props.locked &&
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1, mb: 2 }}>
                    <LoadingButton variant="contained" type="submit" loading={loading}
                                   startIcon={ <EventNoteIcon /> }>
                        Save preferences
                    </LoadingButton>
                    { !!success &&
                        <Typography sx={{ color: 'success.main' }}>
                            {success}
                        </Typography> }
                    { !!error &&
                        <Typography sx={{ color: 'error.main' }}>
                            {error}
                        </Typography> }
                </Stack> }
        </FormContainer>
    );
}