// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';

import { default as MuiLink } from '@mui/material/Link';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import Box from '@mui/material/Box';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import HotelIcon from '@mui/icons-material/Hotel';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import type { PageInfo } from '../verifyAccessAndFetchPageInfo';
import { dayjs } from '@lib/DateTime';

import { RegistrationStatus } from '@lib/database/Types';
import { Avatar } from '@components/Avatar';

/**
 * Formats the difference between `from` and `to`.
 */
function formatTimeDifference(from: dayjs.Dayjs, to: dayjs.Dayjs) {
    const suffix = from.isAfter(to) ? ' ago' : '';

    const earliest = from.isBefore(to) ? from : to;
    const latest = from.isBefore(to) ? to : from;

    function formatResponse(difference: number, unit: string, suffix: string) {
        return {
            difference,
            unit: `${unit}${difference !== 1 ? 's' : ''}${suffix}`,
        };
    }

    const differenceDays = latest.diff(earliest, 'days');
    if (differenceDays >= 7 * 52)
        return formatResponse(latest.diff(earliest, 'years'), 'year', suffix);
    else if (differenceDays >= 7 * 8)
        return formatResponse(latest.diff(earliest, 'weeks'), 'week', suffix);
    else if (differenceDays >= 2)
        return formatResponse(differenceDays, 'day', suffix);

    const differenceHours = latest.diff(earliest, 'hours');
    if (differenceHours >= 2)
        return formatResponse(differenceHours, 'hour', suffix);
    else
        return formatResponse(latest.diff(earliest, 'minutes'), 'minute', suffix);
}

/**
 * Props accepted by the <EventDateTicker> component.
 */
interface EventDateTickerProps {
    /**
     * Date and time on which the event is scheduled to commence.
     */
    startTime: Date;

    /**
     * Date and time on which the event is scheduled to conclude.
     */
    endTime: Date;
}

/**
 * Displays a date and/or time ticker towards the event's starting time. This component has three
 * distinct states: (1) future event, (2) current event, (3) past event.
 */
function EventDateTicker(props: EventDateTickerProps) {
    const currentTime = dayjs();

    const startTime = dayjs(props.startTime);
    const endTime = dayjs(props.endTime);

    let color: string | undefined = undefined;
    let difference: number;
    let unit: string;

    if (currentTime.isBefore(startTime)) {
        ({ difference, unit } = formatTimeDifference(currentTime, startTime));
    } else if (currentTime.isBefore(endTime)) {
        ({ difference, unit } = formatTimeDifference(currentTime, endTime));
        color = 'success.main';
    } else {
        ({ difference, unit } = formatTimeDifference(currentTime, endTime));
        color = 'error.main';
    }

    return (
        <Stack direction="column">
            <Typography variant="h6" align="center" sx={{ color }}>
                {difference}
            </Typography>
            <Typography variant="subtitle2" align="center" sx={{ color }}>
                {unit}
            </Typography>
        </Stack>
    );
}

/**
 * Props accepted by the <EventMetadata> component.
 */
export interface EventMetadataProps {
    /**
     * Information about the event that's being shown.
     */
    event: PageInfo['event'];

    /**
     * Metadata about this event that is to be shown on the overview page.
     */
    metadata?: {
        /**
         * Number of people that we are booking hotel rooms for.
         */
        hotelAssignments: number;

        /**
         * Number of hotel rooms that we are booking
         */
        hotelBookings: number;

        /**
         * Number of hotel rooms that volunteers can choose from.
         */
        hotelOptions: number;

        /**
         * Number of participants across all the training sessions.
         */
        trainingAssignments: number;

        /**
         * Number of training sessions we are planning for this event.
         */
        trainingSessions: number;
    };
}

/**
 * The <EventMetadata> component displays metadata about the event that's being shown, such as when
 * it will happen and progression on gathering hotel and training preferences.
 */
export function EventMetadata(props: EventMetadataProps) {
    const { event, metadata } = props;

    const hotelColor = event.publishHotels ? 'success' : 'error';
    const hotelText =
        event.publishHotels ? 'Hotel data has been published'
                            : 'Hotel data has not been published';

    const trainingColor = event.publishTrainings ? 'success' : 'error';
    const trainingText =
        event.publishTrainings ? 'Training data has been published'
                               : 'Training data has not been published';

    // ---------------------------------------------------------------------------------------------
    // Compose text for hotel information
    // ---------------------------------------------------------------------------------------------

    let hotel: string;
    if (metadata?.hotelAssignments && metadata?.hotelBookings) {
        hotel =
            `${metadata.hotelAssignments} volunteers will stay in ` +
            `${metadata.hotelBookings} hotel rooms`;
    } else if (metadata?.hotelAssignments && metadata?.hotelOptions) {
        hotel =
            `${metadata.hotelAssignments} volunteers have chosen from ` +
            `${metadata.hotelOptions} hotel room options`;
    } else if (metadata?.hotelOptions) {
        hotel = `${metadata.hotelOptions} hotel room options are being planned`;
    } else {
        hotel = 'Hotel room planning has not begun yet.';
    }

    // ---------------------------------------------------------------------------------------------
    // Compose text for training information
    // ---------------------------------------------------------------------------------------------

    let training: string;
    if (metadata?.trainingSessions && metadata?.trainingAssignments) {
        training =
            `${metadata.trainingAssignments} volunteers will participate in ` +
            `${metadata.trainingSessions} training sessions`;
    } else if (metadata?.trainingSessions) {
        training = `${metadata?.trainingSessions} training sessions are being planned`
    } else {
        training = 'Training planning has not begun yet';
    }

    return (
        <Paper sx={{ minHeight: '100%', p: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center"
                   divider={ <Divider orientation="vertical" flexItem /> }>
                <EventDateTicker startTime={event.startTime} endTime={event.endTime} />
                <Box>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                        {event.name}
                    </Typography>
                    <List dense disablePadding>
                        <ListItem disableGutters disablePadding>
                            <ListItemIcon sx={{ minWidth: '40px' }}>
                                <Tooltip title={hotelText}>
                                    <HotelIcon fontSize="small" color={hotelColor} />
                                </Tooltip>
                            </ListItemIcon>
                            <ListItemText>
                                {hotel}
                            </ListItemText>
                        </ListItem>
                        <ListItem disableGutters disablePadding>
                            <ListItemIcon sx={{ minWidth: '40px' }}>
                                <Tooltip title={trainingText}>
                                    <HistoryEduIcon fontSize="small" color={trainingColor} />
                                </Tooltip>
                            </ListItemIcon>
                            <ListItemText>
                                {training}
                            </ListItemText>
                        </ListItem>
                    </List>
                </Box>
            </Stack>
        </Paper>
    );
}
