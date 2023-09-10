// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { type FieldValues, FormContainer, useForm } from 'react-hook-form-mui';
import { dayjs } from '@lib/DateTime';

import LockOpenIcon from '@mui/icons-material/LockOpen';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import type { HotelPreferencesProps } from '@app/registration/[slug]/application/hotel/HotelPreferences';
import { HotelPreferencesForm } from '@app/registration/[slug]/application/hotel/HotelPreferencesForm';
import { SubmitCollapse } from '@app/admin/components/SubmitCollapse';
import { callApi } from '@lib/callApi';

/**
 * Props accepted by the <ApplicationHotelPreferences> component.
 */
export interface ApplicationHotelPreferencesProps {
    /**
     * The event for which the hotel preferences are being shown.
     */
    eventDate: string;

    /**
     * Slug of the event for which these preferences exist.
     */
    eventSlug: string;

    /**
     * Options for hotel rooms that can be presented to the user, inclusive of their label.
     */
    hotelOptions: HotelPreferencesProps['hotelOptions'];

    /**
     * Input to the hotel room preferences this user already expressed previously.
     */
    hotelPreferences: HotelPreferencesProps['hotelPreferences'];

    /**
     * Slug of the team for which the preferences exist.
     */
    teamSlug: string;

    /**
     * User ID of the volunteer for whom preferences are being shown.
     */
    volunteerUserId: number;
}

/**
 * The <ApplicationHotelPreferences> component displays information about this volunteer's hotel
 * preferences. Allocation can be managed through the Hotel tool, available to event administrators.
 */
export function ApplicationHotelPreferences(props: ApplicationHotelPreferencesProps) {
    const { eventDate, hotelOptions } = props;

    const defaultValues = useMemo(() => {
        if (!props.hotelPreferences)
            return undefined;

        return {
            ...props.hotelPreferences,
            interested: props.hotelPreferences.hotelId ? 1 : 0,
            checkIn: props.hotelPreferences.checkIn ? dayjs(props.hotelPreferences.checkIn)
                                                    : undefined,
            checkOut: props.hotelPreferences.checkOut ? dayjs(props.hotelPreferences.checkOut)
                                                      : undefined,
        };
    }, [ props.hotelPreferences ]);

    const form = useForm({ defaultValues });
    const router = useRouter();

    const [ error, setError ] = useState<string | undefined>();
    const [ invalidated, setInvalidated ] = useState<boolean>(false);
    const [ loading, setLoading ] = useState<boolean>(false);

    const handleChange = useCallback(() => setInvalidated(true), [ /* no deps */ ]);
    const handleSubmit = useCallback(async (data: FieldValues) => {
        setLoading(true);
        setError(undefined);
        try {
            const response = await callApi('post', '/api/event/hotel-preferences', {
                environment: props.teamSlug,
                event: props.eventSlug,
                preferences: {
                    interested: !!data.interested,

                    hotelId: data.hotelId,
                    sharingPeople: data.sharingPeople,
                    sharingPreferences: data.sharingPreferences,
                    checkIn: data.checkIn ? dayjs(data.checkIn).format('YYYY-MM-DD') : undefined,
                    checkOut: data.checkOut ? dayjs(data.checkOut).format('YYYY-MM-DD') : undefined,
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
            <Typography variant="h5" sx={{ mb: 2 }}>
                Hotel preferences
                <Tooltip title="Restricted to the hotel management permission">
                    <LockOpenIcon color="warning" fontSize="small"
                                  sx={{ verticalAlign: 'middle', mb: 0.25, ml: 1 }} />
                </Tooltip>
            </Typography>
            <FormContainer formContext={form} onSuccess={handleSubmit}>
                <HotelPreferencesForm eventDate={eventDate} form={form as any}
                                      hotelOptions={hotelOptions} onChange={handleChange} />
                <SubmitCollapse error={error} loading={loading} open={invalidated} sx={{ mt: 2 }} />
            </FormContainer>
        </Paper>
    );
}
