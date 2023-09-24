// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import type { RegistrationData } from '@lib/Registration';
import { ConfirmationBox } from './ConfirmationBox';
import { dayjs } from '@lib/DateTime';

/**
 * Props accepted by the <HotelConfirmation> component.
 */
export interface HotelConfirmationProps {
    /**
     * The hotel room bookings for which confirmation is being shown.
     */
    bookings: RegistrationData['hotelBookings'];
}

/**
 * The <HotelConfirmation> component displays the confirmed hotel room bookings for the volunteer.
 * It's possible for there to be multiple bookings, in case they stay longer than the weekend.
 */
export function HotelConfirmation(props: HotelConfirmationProps) {
    const { bookings } = props;

    return (
        <Box sx={{ mt: 1 }}>
            <Typography variant="h5">
                Your confirmed booking{ bookings.length > 1 ? 's' : '' }
            </Typography>
            { bookings.map((booking, index) => {
                const primary = `${booking.hotel.name} (${booking.hotel.room})`;
                const secondary =
                    `Check in on ${dayjs(booking.checkIn).format('dddd, MMMM D')}, check out on ` +
                    `${dayjs(booking.checkOut).format(' dddd, MMMM D')}`;
                const tertiary =
                    !!booking.sharing.length
                        ? `You'll share this room with ${booking.sharing.join(' & ')}`
                        : 'You won\'t share this room with anyone';

                return <ConfirmationBox key={index} primary={primary} secondary={secondary}
                                        tertiary={tertiary} />;
            }) }
        </Box>
    );
}
