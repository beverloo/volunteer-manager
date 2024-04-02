// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import List from '@mui/material/List';
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
        // TODO: Figure out what this should look like. (I.e. finished event card.)
        return (
            <Typography sx={{ color: 'text.disabled', pl: 2, pb: 1 }}>
                Nothing to see here, move along...
            </Typography>
        );
    } else {
        return (
            <List dense disablePadding>
                { props.timeslots.map(timeslot =>
                    <CardTimeslotEntry key={timeslot.id} currentInstant={props.currentInstant}
                                       timeslot={timeslot} /> ) }
            </List>
        );
    }
}
