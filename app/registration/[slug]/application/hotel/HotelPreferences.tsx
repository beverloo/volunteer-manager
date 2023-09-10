// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useState } from 'react';

import { type FieldValues, FormContainer, useForm } from 'react-hook-form-mui';

import Box from '@mui/material/Box';
import HotelIcon from '@mui/icons-material/Hotel';
import LoadingButton from '@mui/lab/LoadingButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { HotelPreferencesForm, type HotelPreferencesFormProps } from './HotelPreferencesForm';
import { Markdown } from '@app/components/Markdown';

/**
 * Message to display to volunteers when their preferences have been marked as read-only.
 */
const kPreferencesLockedMarkdown =
    '> Great news! Your booking is confirmed, and your preferences have been locked in.';

/**
 * Props accepted by the <HotelPreferences> component.
 */
export interface HotelPreferencesProps {
    /**
     * Date on which the event will take place. Used to focus the check-{in, out} pickers.
     */
    eventDate?: string;

    /**
     * Options for hotel rooms that can be presented to the user, inclusive of their label.
     */
    hotelOptions: HotelPreferencesFormProps['hotelOptions'];

    /**
     * Whether the form should be marked as read-only, useful in case the hotel booking has been
     * confirmed. Changes can only be made after that by e-mailing our team.
     */
    readOnly?: boolean;
}

/**
 * The <HotelPreferences> component is a form that enabled a volunteer to update their hotel
 * preferences, unless said preferences have been locked as read-only because the booking was
 * confirmed.
 */
export function HotelPreferences(props: HotelPreferencesProps) {
    const { hotelOptions, readOnly } = props;

    const form = useForm(/* TODO: defaultValues */);

    const [ error, setError ] = useState<string | undefined>();
    const [ loading, setLoading ] = useState<boolean>(false);

    const handleSubmit = useCallback(async (data: FieldValues) => {
        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [ /* no deps */ ]);

    return (
        <Box sx={{ mt: 1, mb: 2 }}>
            <Typography variant="h5" sx={ readOnly ? {} : { mb: 1 } }>
                Your hotel room preferences
            </Typography>
            { readOnly && <Markdown sx={{ mt: -1, mb: 1 }}>{kPreferencesLockedMarkdown}</Markdown> }
            <FormContainer formContext={form} onSuccess={handleSubmit}>
                <HotelPreferencesForm eventDate={props.eventDate} form={form}
                                      hotelOptions={hotelOptions} readOnly={readOnly} />
                <Stack direction="row" spacing={2} alignItems="center" sx={{ pt: 2 }}>
                    <LoadingButton startIcon={ <HotelIcon /> } variant="contained"
                                   loading={loading} type="submit">
                        Store my preferences
                    </LoadingButton>
                    { error &&
                        <Typography sx={{ color: 'error.main' }}>
                            Yow
                        </Typography> }
                </Stack>
            </FormContainer>
        </Box>
    );
}
