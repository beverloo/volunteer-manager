// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useEffect, useState } from 'react';

import type { UseFormReturn } from 'react-hook-form-mui';
import { DatePickerElement } from 'react-hook-form-mui/date-pickers';
import { SelectElement, TextFieldElement } from 'react-hook-form-mui';

import Collapse from '@mui/material/Collapse';
import Grid from '@mui/material/Unstable_Grid2';

import { Temporal, formatDate } from '@lib/Temporal';
import { dayjs } from '@lib/DateTime';

/**
 * Options users can choose from when indicating whether they would like a hotel room.
 */
const kInterestedOptions = [
    { id: 0, label: 'No, I don\'t need a hotel room' },
    { id: 1, label: 'Yes, I would like a hotel room' },
];

/**
 * How many days before and after the event can a hotel room be booked for?
 */
const kSelectableDaysAroundEvent = 5;

/**
 * Props accepted by the <HotelPreferencesForm> component.
 */
export interface HotelPreferencesFormProps {
    /**
     * Date on which the event will take place. When provided, this will limit the minimal and
     * maximal selectable dates within the picker. Will be provided in a `Temporal.ZonedDateTime`
     * compatible format in UTC.
     */
    eventDate?: string;

    /**
     * The context within which this form is being displayed.
     */
    form: UseFormReturn;

    /**
     * Options for hotel rooms that can be presented to the user, inclusive of their label.
     */
    hotelOptions: { id: number; label: string; }[];

    /**
     * Callback to be invoked when the value of one of the form fields has changed.
     */
    onChange?: () => void;

    /**
     * Whether the form should be marked as read-only, useful in case the hotel booking has been
     * confirmed. Changes can only be made after that by e-mailing our team.
     */
    readOnly?: boolean;
}

/**
 * The <HotelPreferencesFormProps> component displays the actual form through which volunteers can
 * indicate their hotel room preferences. It will have to be saved by a higher-level component.
 */
export function HotelPreferencesForm(props: HotelPreferencesFormProps) {
    const { form, hotelOptions, onChange, readOnly } = props;

    const interested = form.watch('interested');

    const [ minDate, setMinDate ] = useState<dayjs.Dayjs | undefined>(undefined);
    const [ maxDate, setMaxDate ] = useState<dayjs.Dayjs | undefined>(undefined);

    useEffect(() => {
        if (!props.eventDate)
            return;

        const eventDateTemporal = Temporal.ZonedDateTime.from(props.eventDate);
        const eventDate = dayjs(formatDate(eventDateTemporal, 'YYYY-MM-DD[ 12:00:00]'));
        if (!eventDate.isValid())
            return;

        setMinDate(eventDate.subtract(kSelectableDaysAroundEvent, 'day'));
        setMaxDate(eventDate.add(kSelectableDaysAroundEvent, 'day'));

    }, [ props.eventDate ]);

    return (
        <>
            <SelectElement name="interested" label="Would you like a hotel room?"
                           options={kInterestedOptions} fullWidth size="small" required
                           onChange={onChange} disabled={readOnly} />
            <Collapse in={!!interested} mountOnEnter unmountOnExit>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid xs={12}>
                        <SelectElement name="hotelId" label="Which room would you like?"
                                       options={hotelOptions} fullWidth size="small" required
                                       onChange={onChange} disabled={readOnly} />
                    </Grid>

                    <Grid xs={6}>
                        <TextFieldElement name="sharingPeople" label="For how many people?"
                                          fullWidth size="small" required type="number"
                                          disabled={readOnly} onChange={onChange} />
                    </Grid>
                    <Grid xs={6}>
                        <TextFieldElement name="sharingPreferences" label="Sharing preferences?"
                                          fullWidth size="small" required
                                          disabled={readOnly} onChange={onChange} />
                    </Grid>

                    <Grid xs={6}>
                        <DatePickerElement name="checkIn" label="Check in" textReadOnly
                                           inputProps={{ fullWidth: true, size: 'small' }}
                                           minDate={minDate} maxDate={maxDate} required
                                           disabled={readOnly} onChange={onChange} />
                    </Grid>
                    <Grid xs={6}>
                        <DatePickerElement name="checkOut" label="Check out" textReadOnly
                                           inputProps={{ fullWidth: true, size: 'small' }}
                                           minDate={minDate} maxDate={maxDate} required
                                           disabled={readOnly} onChange={onChange} />
                    </Grid>
                </Grid>
            </Collapse>
        </>
    );
}
