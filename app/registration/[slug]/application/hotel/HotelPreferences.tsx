// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { type FieldValues, FormContainer, useForm } from '@proxy/react-hook-form-mui';
import { dayjs } from '@lib/DateTime';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import HotelIcon from '@mui/icons-material/Hotel';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { HotelPreferencesForm, type HotelPreferencesFormProps } from './HotelPreferencesForm';
import { Markdown } from '@components/Markdown';
import { callApi } from '@lib/callApi';

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
     * URL-save slug of the event for which the preferences are being shown.
     */
    event: string;

    /**
     * Date on which the event will take place. Used to focus the check-{in, out} pickers.
     */
    eventDate?: string;

    /**
     * Options for hotel rooms that can be presented to the user, inclusive of their label.
     */
    hotelOptions: HotelPreferencesFormProps['hotelOptions'];

    /**
     * Input to the hotel room preferences this user already expressed previously.
     */
    hotelPreferences?: {
        interested?: number,
        hotelId?: number,
        sharingPeople?: number,
        sharingPreferences?: string,
        checkIn?: string,
        checkOut?: string,
    };

    /**
     * Whether the form should be marked as read-only, useful in case the hotel booking has been
     * confirmed. Changes can only be made after that by e-mailing our team.
     */
    readOnly?: boolean;

    /**
     * URL-safe slug that identifies the team in scope for this request.
     */
    team: string;
}

/**
 * The <HotelPreferences> component is a form that enabled a volunteer to update their hotel
 * preferences, unless said preferences have been locked as read-only because the booking was
 * confirmed.
 */
export function HotelPreferences(props: HotelPreferencesProps) {
    const { hotelOptions, readOnly } = props;

    const defaultValues = useMemo(() => {
        return {
            ...props.hotelPreferences,
            checkIn: props.hotelPreferences?.checkIn ? dayjs(props.hotelPreferences.checkIn)
                                                     : undefined,
            checkOut: props.hotelPreferences?.checkOut ? dayjs(props.hotelPreferences.checkOut)
                                                       : undefined,
        };
    }, [ props.hotelPreferences ]);

    const form = useForm({ defaultValues });
    const router = useRouter();

    const [ error, setError ] = useState<string | undefined>();
    const [ loading, setLoading ] = useState<boolean>(false);
    const [ success, setSuccess ] = useState<string | undefined>();

    const handleSubmit = useCallback(async (data: FieldValues) => {
        setLoading(true);
        setError(undefined);
        setSuccess(undefined);
        try {
            if (props.readOnly)
                throw new Error('Your preferences have bene locked in already.');

            const response = await callApi('post', '/api/event/hotel-preferences', {
                event: props.event,
                team: props.team,
                preferences: {
                    interested: !!data.interested,

                    hotelId: data.hotelId,
                    sharingPeople: data.sharingPeople,
                    sharingPreferences: data.sharingPreferences,
                    checkIn: data.checkIn ? dayjs(data.checkIn).format('YYYY-MM-DD') : undefined,
                    checkOut: data.checkOut ? dayjs(data.checkOut).format('YYYY-MM-DD') : undefined,
                },
            });

            if (response.success) {
                setSuccess('Your preferences have been updated!');
                router.refresh();
            } else {
                setError(response.error);
            }
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [ props.event, props.readOnly, props.team, router ]);

    const [ confirmationOpen, setConfirmationOpen ] = useState<boolean>(false);
    const [ fieldValues, setFieldValues ] = useState<FieldValues | undefined>();

    const confirmBooking = useCallback(async () => {
        if (!fieldValues)
            return;  // this shouldn't happen outside of development

        setConfirmationOpen(false);
        await handleSubmit(fieldValues);
    }, [ fieldValues, handleSubmit ]);

    const maybeHandleSubmit = useCallback(async (data: FieldValues) => {
        if (!!data.interested) {
            setFieldValues(data);
            setConfirmationOpen(true);
        } else {
            await handleSubmit(data);
        }
    }, [ handleSubmit ]);

    return (
        <Box sx={{ mt: 1, mb: 2 }}>
            <Typography variant="h5" sx={ readOnly ? {} : { mb: 1 } }>
                Your hotel room preferences
            </Typography>
            { readOnly && <Markdown sx={{ mt: -1, mb: 1 }}>{kPreferencesLockedMarkdown}</Markdown> }
            <FormContainer formContext={form} onSuccess={maybeHandleSubmit}>
                <HotelPreferencesForm eventDate={props.eventDate} form={form as any}
                                      hotelOptions={hotelOptions} readOnly={readOnly} />
                { !readOnly &&
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ pt: 2 }}>
                        <Button startIcon={ <HotelIcon /> } variant="contained" loading={loading}
                                type="submit">
                            Update my preferences
                        </Button>
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
            <Dialog open={confirmationOpen} onClose={ () => setConfirmationOpen(false) } fullWidth>
                <DialogTitle>
                    You're booking a hotel room
                </DialogTitle>
                <DialogContent>
                    Your hotel room will be confirmed in the months leading to the event. If you
                    need to cancel your reservation within 6 weeks of the event, you will either
                    need to pay the full amount or find someone else to stay in the room.
                </DialogContent>
                <DialogActions sx={{ pr: 2, pb: 2 }}>
                    <Button onClick={ () => setConfirmationOpen(false) }>
                        Cancel
                    </Button>
                    <Button variant="contained" onClick={confirmBooking}>
                        Continue
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
