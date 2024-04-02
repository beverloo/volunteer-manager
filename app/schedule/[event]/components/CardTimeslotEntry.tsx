// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';

import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';

import type { Temporal } from '@lib/Temporal';

/**
 * Type definition of the information we need to know about a timeslot.
 */
export interface CardTimeslot {
    /**
     * Unique ID of the timeslot.
     */
    id: string;

    /**
     * Unique ID of the activity the timeslot belongs to.
     */
    activityId?: string;

    /**
     * UNIX timestamp indicating the time at which this timeslot will start.
     */
    start: number;

    /**
     * UNIX timestamp indicating the time at which this timeslot will finish.
     */
    end: number;

    /**
     * Title to show on the timeslot entry.
     */
    title: string;

    // TODO: visible
}

/**
 * Props accepted by the <CardTimeslotEntry> component.
 */
export interface CardTimeslotEntryProps {
    /**
     * Current Temporal Instant based on which timing calculations will be done.
     */
    currentInstant: Temporal.Instant;

    /**
     * The timeslots that this entry should display.
     */
    timeslot: CardTimeslot;
}

/**
 * The <CardTimeslotEntry> component shows a singular entry of a timeslot entry. The
 */
export function CardTimeslotEntry(props: CardTimeslotEntryProps) {
    const { currentInstant, timeslot } = props;

    // TODO: Activity state
    // TODO: Time until {start, end}
    // TODO: Visibility

    return (
        <ListItemButton LinkComponent={Link} href={`../events/${timeslot.activityId}`}>
            <ListItemText primary={timeslot.title} />
            <Typography variant="body2">
                [time]
            </Typography>
        </ListItemButton>
    );
}
