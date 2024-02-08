// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import type { RegistrationTraining } from '@lib/Registration';
import { ConfirmationBox } from '../hotel/ConfirmationBox';
import { Temporal, formatDate } from '@lib/Temporal';

/**
 * Props accepted by the <TrainingConfirmation> component.
 */
export interface TrainingConfirmationProps {
    /**
     * Timezone in which the event will be taking place.
     */
    timezone: string;

    /**
     * Information about the volunteer's training participation that we're representing.
     */
    training: RegistrationTraining;
}

/**
 * The <TrainingConfirmation> component displays confirmation of a training session being assigned,
 * or that the volunteer does not have to participate in the training.
 */
export function TrainingConfirmation(props: TrainingConfirmationProps) {
    const { timezone, training } = props;

    let confirmationBox: React.ReactNode = undefined;
    if (!!training.assignedDate && !!training.assignedEndDate) {
        const date =
            formatDate(
                Temporal.ZonedDateTime.from(training.assignedDate).withTimeZone(timezone),
                'dddd, MMMM D');

        const startTime =
            formatDate(
                Temporal.ZonedDateTime.from(training.assignedDate).withTimeZone(timezone),
                'H:mm');

        const endTime =
            formatDate(
                Temporal.ZonedDateTime.from(training.assignedEndDate).withTimeZone(timezone),
                'H:mm');

        const primary = `You'll be joining the training on ${date}`;
        const secondary = training.assignedAddress ?? '';
        const tertiary = `Please be there at ${startTime}, we'll finish around ${endTime}`;

        confirmationBox = (
            <ConfirmationBox primary={primary} secondary={secondary} tertiary={tertiary} />
        );
    } else {
        confirmationBox = (
            <ConfirmationBox primary="You'll skip the professional training this year"
                             secondary="We look forward to seeing you at the event instead!" />
        );
    }

    return (
        <Box sx={{ mt: 1 }}>
            <Typography variant="h5">
                Your confirmed participation
            </Typography>
            {confirmationBox}
        </Box>
    );
}
