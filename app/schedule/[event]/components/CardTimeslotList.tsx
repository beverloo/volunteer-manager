// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import DoneAllIcon from '@mui/icons-material/DoneAll';
import List from '@mui/material/List';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { Temporal } from '@lib/Temporal';
import { CardTimeslotEntry, type CardTimeslot } from './CardTimeslotEntry';

/**
 * Props accepted by the <CardTimeslotList> component.
 */
export interface CardTimeslotListProps {
    /**
     * Current Temporal Instant based on which timing calculations will be done.
     */
    currentInstant: Temporal.Instant;

    /**
     * URL prefix to apply to all links shown in the list.
     */
    prefix: string;

    /**
     * The timeslots to display on this card, in display order.
     */
    timeslots: CardTimeslot[];
}

/**
 * The <CardTimeslotList> component shows a list of timeslots in the layout appropriate for area or
 * location cards. This component imposes no limit on the number of timeslots to be shown.
 */
export function CardTimeslotList(props: CardTimeslotListProps) {
    if (!props.timeslots.length) {
        return (
            <Paper variant="outlined" sx={{ p: 1, mx: 1, mb: 1, backgroundColor: 'grey.50' }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <DoneAllIcon color="success" fontSize="small" />
                    <Typography variant="body2">
                        No further events have been scheduled…
                    </Typography>
                </Stack>
            </Paper>
        );
    } else {
        return (
            <List dense disablePadding>
                { props.timeslots.map(timeslot =>
                    <CardTimeslotEntry key={timeslot.id} currentInstant={props.currentInstant}
                                       prefix={props.prefix} timeslot={timeslot} /> ) }
            </List>
        );
    }
}
