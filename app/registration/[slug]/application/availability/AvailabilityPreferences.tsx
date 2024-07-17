// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { type FieldValues, AutocompleteElement, FormContainer } from '@proxy/react-hook-form-mui';

import Box from '@mui/material/Box';
import EventNoteIcon from '@mui/icons-material/EventNote';
import Grid from '@mui/material/Unstable_Grid2';
import LoadingButton from '@mui/lab/LoadingButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { EventTimeslotEntry } from './getPublicEventsForFestival';
import type { RegistrationAvailability } from '@lib/Registration';
import { ApplicationAvailabilityForm } from '../ApplicationParticipation';
import { Markdown } from '@components/Markdown';
import { callApi } from '@lib/callApi';

/**
 * Function used to generate the ordinal belonging to a particular number.
 * @see https://stackoverflow.com/a/39466341
 */
const kOrdinalFn = (n: number) => [ 'st', 'nd', 'rd' ][ ((n + 90) % 100 - 10) % 10 - 1 ] || 'th';

/**
 * Message to display to volunteers when their preferences have been marked as read-only.
 */
const kPreferencesLockedMarkdown =
    '> We\'ve started drafting your schedule, and your preferences have been locked in.';

/**
 * Props accepted by the <AvailabilityPreferences> component.
 */
interface AvailabilityPreferencesProps {
    /**
     * URL-save slug of the event for which preferences are being displayed.
     */
    event: string;

    /**
     * Events that exist in the program. Only public events should be listed.
     */
    events: EventTimeslotEntry[];

    /**
     * Maximum number of options to display to the volunteer.
     */
    limit: number;

    /**
     * The volunteer's current preferences, if any.
     */
    preferences: RegistrationAvailability;

    /**
     * Whether the preferences are locked. This generally is the case when we're too close to the
     * event and changes to the schedule should not be made anymore.
     */
    readOnly?: boolean;

    /**
     * URL-safe slug that identifies the team in scope for this request.
     */
    team: string;
}

/**
 * The <AvailabilityPreferences> component enables volunteers to indicate which events they really
 * want to attend. Each volunteer has a set maximum number of events to "reserve".
 */
export function AvailabilityPreferences(props: AvailabilityPreferencesProps) {
    const router = useRouter();

    const [ error, setError ] = useState<string | undefined>();
    const [ loading, setLoading ] = useState<boolean>(false);
    const [ success, setSuccess ] = useState<string | undefined>();

    const handleSavePreferences = useCallback(async (data: FieldValues) => {
        setError(undefined);
        setLoading(true);
        setSuccess(undefined);
        try {
            if (props.readOnly)
                throw new Error('Please e-mail us for any further changes!');

            const eventPreferences: number[] = [];
            for (let index = 0; index < props.limit; ++index) {
                if (!Object.hasOwn(data, `preference_${index}`))
                    continue;  // no value has been set

                const timeslotId = data[`preference_${index}`];
                if (typeof timeslotId === 'number' && !Number.isNaN(timeslotId)) {
                    if (!eventPreferences.includes(timeslotId))
                        eventPreferences.push(timeslotId);
                }
            }

            const response = await callApi('post', '/api/event/availability-preferences', {
                event: props.event,
                eventPreferences,
                preferences: data.preferences,
                serviceHours: `${data.serviceHours}` as any,
                serviceTiming: data.serviceTiming,
                team: props.team,
            });

            if (response.success) {
                setSuccess('Your preferences have been saved!');
                router.refresh();
            } else {
                setError(response.error ?? 'Your preferences could not be saved!');
            }
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [ props.event, props.limit, props.readOnly, props.team, router ]);

    const defaultValues = useMemo(() => ({
        preferences: props.preferences.preferences,
        serviceHours: props.preferences.serviceHours,
        serviceTiming: props.preferences.serviceTiming,
        ...Object.fromEntries(props.preferences.timeslots.map((value, index) =>
            [ `preference_${index}`, value ])),
    }), [ props.preferences ]);

    return (
        <FormContainer defaultValues={defaultValues} onSuccess={handleSavePreferences}>
            <Box sx={{ my: 1 }}>
                <Typography variant="h5">
                    When will you be helping out?
                </Typography>
                { props.readOnly &&
                    <Markdown sx={{ mt: -1, mb: 1 }}>{kPreferencesLockedMarkdown}</Markdown> }
                <Grid container spacing={2} sx={{ mt: 1, mb: 2 }}>
                    <ApplicationAvailabilityForm readOnly={props.readOnly} />
                </Grid>
            </Box>

            { (props.limit > 0 && props.events.length > 0) &&
                <Box sx={{ my: 1 }}>
                    <Typography variant="h5">
                        Events that you plan to attend?
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
                                                             disabled: !!props.readOnly,
                                                             fullWidth: true,
                                                             size: 'small',
                                                         }}
                                                         label="Event…"
                                                         options={props.events} matchId />
                                </Grid>
                            </React.Fragment> )}
                    </Grid>
                </Box> }

            { !props.readOnly &&
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
