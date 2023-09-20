// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import type { SxProps, Theme } from '@mui/system';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { darken, lighten } from '@mui/material/styles';

import type { RegistrationData } from '@lib/Registration';
import { dayjs } from '@lib/DateTime';

/**
 * Manual styles that apply to the <HotelConfirmation> client component.
 */
const kStyles: { [key: string]: SxProps<Theme> } = {
    confirmation: theme => ({
        borderLeft: `4px solid ${theme.palette.success.main}`,
        paddingX: 2,
        paddingY: 1,
        marginY: 2,

        borderRadius: theme.shape.borderRadius,
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
        backgroundColor: theme.palette.mode === 'light' ? lighten(theme.palette.success.main, .93)
                                                        : darken(theme.palette.success.main, .6),
    }),
};

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
            { bookings.map((booking, index) =>
                <Box key={index} sx={kStyles.confirmation}>
                    <Typography variant="h6">
                        {booking.hotel.name} ({booking.hotel.room})
                    </Typography>
                    <Typography variant="body1">
                        Check in on {dayjs(booking.checkIn).format('dddd, MMMM D')}, check out on
                        {dayjs(booking.checkOut).format(' dddd, MMMM D')}
                    </Typography>
                    { booking.sharing.length > 0 &&
                        <Typography variant="body1">
                            You'll share this room with {booking.sharing.join(' & ')}
                        </Typography> }
                    { booking.sharing.length === 0 &&
                        <Typography variant="body1">
                            You won't share this room with anyone
                        </Typography> }
                </Box> )}
        </Box>
    );
}
