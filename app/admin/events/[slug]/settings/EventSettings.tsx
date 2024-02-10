// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import { type FieldValues, FormContainer, SelectElement, TextFieldElement }
    from 'react-hook-form-mui';

import Grid from '@mui/material/Unstable_Grid2';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import type { PageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import { EventAvailabilityStatus } from '@lib/database/Types';
import { EventSettingsForm } from './EventSettingsForm';
import { SubmitCollapse } from '@app/admin/components/SubmitCollapse';
import { Temporal } from '@lib/Temporal';
import { callApi } from '@lib/callApi';
import { dayjs } from '@lib/DateTime';

/**
 * Options that can be presented to the senior in regards to the event availability status.
 */
const kAvailabilityStatusOptions = [
    {
        id: EventAvailabilityStatus.Unavailable,
        label: 'Volunteers cannot indicate their availability'
    },
    {
        id: EventAvailabilityStatus.Available,
        label: 'Volunteers can indicate their availability'
    },
    {
        id: EventAvailabilityStatus.Locked,
        label: 'Volunteers can see their availability, but not change it'
    },
] satisfies { id: EventAvailabilityStatus; label: string }[];

/**
 * Props accepted by the <EventSettings> component.
 */
export interface EventSettingsProps {
    /**
     * Information about the event whose settings are being changed.
     */
    event: PageInfo['event'];
}

/**
 * The <EventSettings> component allows the administrator to change settings about the event itself,
 * such as its name, slug and dates over which it will take.
 */
export function EventSettings(props: EventSettingsProps) {
    const { event } = props;

    const [ error, setError ] = useState<string | undefined>();
    const [ invalidated, setInvalidated ] = useState<boolean>(false);
    const [ loading, setLoading ] = useState<boolean>(false);

    const router = useRouter();

    const handleChange = useCallback(() => setInvalidated(true), [ setInvalidated ]);
    const handleSubmit = useCallback(async (data: FieldValues) => {
        setLoading(true);
        try {
            const response = await callApi('post', '/api/admin/update-event', {
                event: event.slug,
                eventSettings: {
                    name: data.name,
                    shortName: data.shortName,
                    timezone: data.timezone,
                    startTime: dayjs(data.startTime).utc().toISOString(),
                    endTime: dayjs(data.endTime).utc().toISOString(),
                    availabilityStatus: data.availabilityStatus,
                    location: data.location,
                    festivalId: data.festivalId,
                    hotelRoomForm: data.hotelRoomForm,
                },
            });

            if (response.success) {
                setInvalidated(false);
                router.refresh();
            }
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [ event, router ]);

    const defaultValues = {
        ...event,

        startTime: dayjs(Temporal.ZonedDateTime.from(event.startTime).toString({
            timeZoneName: 'never'
        })).tz(event.timezone),

        endTime: dayjs(Temporal.ZonedDateTime.from(event.endTime).toString({
            timeZoneName: 'never'
        })).tz(event.timezone),
    };

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ pb: 2 }}>
                Event settings
            </Typography>
            <FormContainer defaultValues={defaultValues} onSuccess={handleSubmit}>
                <EventSettingsForm onChange={handleChange} />
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid xs={6}>
                        <TextFieldElement name="location" label="Location"
                                          fullWidth size="small" onChange={handleChange} />
                    </Grid>
                    <Grid xs={6}>
                        <TextFieldElement name="timezone" label="Timezone"
                                          fullWidth size="small" onChange={handleChange} />
                    </Grid>
                    <Grid xs={12}>
                        <SelectElement name="availabilityStatus" label="Availability status"
                                       fullWidth size="small" onChange={handleChange}
                                       options={kAvailabilityStatusOptions} />
                    </Grid>
                    <Grid xs={6}>
                        <TextFieldElement name="festivalId" label="AnPlan Festival ID" type="number"
                                          fullWidth size="small" onChange={handleChange} />
                    </Grid>
                    <Grid xs={6}>
                        <TextFieldElement name="hotelRoomForm" label="Hotel room form URL"
                                          fullWidth size="small" onChange={handleChange} />
                    </Grid>
                </Grid>
                <SubmitCollapse error={error} loading={loading} open={invalidated} sx={{ mt: 2 }}/>
            </FormContainer>
        </Paper>
    );
}
