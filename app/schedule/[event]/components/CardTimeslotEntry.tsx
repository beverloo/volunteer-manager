// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';

import type { SxProps } from '@mui/system';
import type { Theme } from '@mui/material/styles';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import VisibilityIcon from '@mui/icons-material/Visibility';

import { Temporal, formatDate } from '@lib/Temporal';
import { currentTimezone } from '../CurrentTime';

/**
 * CSS customizations applied to the <CardTimeslotEntry> component.
 */
const kStyles: { [key: string]: SxProps<Theme> } = {
    primary: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
};

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

    /**
     * Set when the timeslot is invisible to the public.
     */
    invisible?: true;
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

    const timezone = currentTimezone();

    let time: React.ReactNode;
    if (currentInstant.epochSeconds >= timeslot.end) {
        // Past events should not be shown as <CardTimeslotEntry> components. If we end up in here
        // then something is off; don't do any unnecessary work in addition to that.

    } else if (currentInstant.epochSeconds >= timeslot.start) {
        // Active events:

        const endZonedDateTime =
            Temporal.Instant.fromEpochSeconds(timeslot.end).toZonedDateTimeISO(timezone);

        time = `until ${formatDate(endZonedDateTime, 'HH:mm')}`;

    } else {
        // Future events:

        const startZonedDateTime =
            Temporal.Instant.fromEpochSeconds(timeslot.start).toZonedDateTimeISO(timezone);
        const endZonedDateTime =
            Temporal.Instant.fromEpochSeconds(timeslot.end).toZonedDateTimeISO(timezone);

        time =
            `${formatDate(startZonedDateTime, 'HH:mm')}–${formatDate(endZonedDateTime, 'HH:mm')}`;
    }

    // TODO: Activity state

    return (
        <ListItemButton LinkComponent={Link} href={`../events/${timeslot.activityId}`}>

            { !timeslot.invisible &&
                <ListItemText primaryTypographyProps={{ sx: kStyles.primary }}
                              primary={timeslot.title} /> }

            { !!timeslot.invisible &&
                <ListItemText primaryTypographyProps={{ sx: kStyles.primary }}
                              primary={
                                  <>
                                      <em>{timeslot.title}</em>
                                      <Tooltip title="Hidden from visitors">
                                          <VisibilityIcon fontSize="inherit" color="info"
                                                          sx={{ marginLeft: 1,
                                                                verticalAlign: 'middle' }} />
                                      </Tooltip>
                                  </>
                              } /> }

            { !!time &&
                <Typography variant="caption"
                            sx={{ color: 'text.secondary', whiteSpace: 'nowrap', pl: 2 }}>
                    {time}
                </Typography> }

        </ListItemButton>
    );
}
