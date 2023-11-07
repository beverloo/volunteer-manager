// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Typography from '@mui/material/Typography';

import type { RegistrationRefund } from '@lib/Registration';
import { ConfirmationBox } from '../hotel/ConfirmationBox';
import { dayjs } from '@lib/DateTime';

/**
 * Props accepted by the <RefundConfirmation> component.
 */
export interface RefundConfirmationProps {
    /**
     * The refund request that we're displaying a confirmation for, if any.
     */
    refund?: RegistrationRefund;
}

/**
 * The <RefundConfirmation> component displays the status of a refund request that the volunteer has
 * submitted, differentiating between a requested refund and an issued refund.
 */
export function RefundConfirmation(props: RefundConfirmationProps) {
    if (!props.refund)
        return <></>;

    const { confirmed, requested } = props.refund;

    const secondary: string =
        `You requested the refund on ${dayjs(requested).format('dddd, MMMM D')}.`;

    let primary: string = '';
    let tertiary: string | undefined;

    if (!!confirmed) {
        primary = 'Your refund has been confirmed!';
        tertiary = `We issued the refund on ${dayjs(confirmed).format('dddd, MMMM D')}.`;
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
