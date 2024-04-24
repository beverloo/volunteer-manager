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

import type { Temporal } from '@lib/Temporal';

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

    // TODO: Activity state
    // TODO: Time until {start, end}

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

            <Typography variant="body2">
                [time]
            </Typography>
        </ListItemButton>
    );
}
