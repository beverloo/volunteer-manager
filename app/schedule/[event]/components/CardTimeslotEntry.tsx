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
import { darken, lighten } from '@mui/material/styles';

import { formatDate, type Temporal } from '@lib/Temporal';
import { isNextDay } from '../lib/isNextDay';
import { toZonedDateTime } from '../CurrentTime';

/**
 * CSS customizations applied to the <CardTimeslotEntry> component.
 */
const kStyles: { [key: string]: SxProps<Theme> } = {
    activeEvent: {
        backgroundColor: theme => {
            return theme.palette.mode === 'dark' ? darken(/* green[900]= */ '#1B5E20', .25)
                                                 : lighten(theme.palette.success.light, .9);
        },
    },

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
     * Current Temporal ZonedDateTime based on which timing calculations will be done.
     */
    currentTime: Temporal.ZonedDateTime;

    /**
     * URL prefix to apply to the outgoing link for this item.
     */
    prefix: string;

    /**
     * The timeslots that this entry should display.
     */
    timeslot: CardTimeslot;
}

/**
 * The <CardTimeslotEntry> component shows a singular entry of a timeslot entry. The
 */
export function CardTimeslotEntry(props: CardTimeslotEntryProps) {
    const { currentTime, prefix, timeslot } = props;

    let styles: SxProps<Theme> = null;
    let time: React.ReactNode;

    if (currentTime.epochSeconds >= timeslot.end) {
        // Past events should not be shown as <CardTimeslotEntry> components. If we end up in here
        // then something is off; don't do any unnecessary work in addition to that.

    } else if (currentTime.epochSeconds >= timeslot.start) {
        // Active events:

        const endZonedDateTime = toZonedDateTime(timeslot.end);

        styles = kStyles.activeEvent;
        time = `until ${formatDate(endZonedDateTime, 'HH:mm')}`;

    } else {
        // Future events:

        const startZonedDateTime = toZonedDateTime(timeslot.start);
        const endZonedDateTime = toZonedDateTime(timeslot.end);

        const format = isNextDay(currentTime, startZonedDateTime) ? 'ddd, HH:mm' : 'HH:mm';
        time = `${formatDate(startZonedDateTime, format)}–${formatDate(endZonedDateTime, 'HH:mm')}`;
    }

    return (
        <ListItemButton LinkComponent={Link} href={`${prefix}/events/${timeslot.activityId}`}
                        sx={styles}>

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
