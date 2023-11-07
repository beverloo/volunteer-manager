// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { ConfirmationBox } from '../hotel/ConfirmationBox';
import { dayjs } from '@lib/DateTime';

/**
 * Props accepted by the <RefundStatus> component.
 */
export interface RefundStatusProps {
    /**
     * Date on which the refund was confirmed, if any.
     */
    confirmed?: Date;

    /**
     * Date on which the refund had been requested, if any.
     */
    requested: Date;
}

/**
 * The <RefundStatus> component displays the status of a refund request that the volunteer has
 * submitted, differentiating between a requested refund and an issued refund.
 */
export function RefundStatus(props: RefundStatusProps) {
    const secondary: string =
        `You requested the refund on ${dayjs(props.requested).format('dddd, MMMM D')}.`;

    let primary: string = '';
    let tertiary: string | undefined;

    if (!!props.confirmed) {
        primary = 'Your refund has been confirmed!';
        tertiary = `We issued the refund on ${dayjs(props.confirmed).format('dddd, MMMM D')}.`;
    } else {
        primary = 'Your request has been received';
    }

    return (
        <>
            <Typography variant="h5" sx={{ mt: 1 }}>
                Your ticket refund request
            </Typography>
            <ConfirmationBox primary={primary} secondary={secondary} tertiary={tertiary} />
        </>
    );
}
