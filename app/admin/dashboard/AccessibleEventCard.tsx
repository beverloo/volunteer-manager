// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useRouter } from 'next/navigation';

import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';

import { Temporal, formatDate } from '@lib/Temporal';

/**
 * Representation of an accessible event to display on the dashboard.
 */
export interface AccessibleEvent {
    /**
     * Name of the event that's being displayed.
     */
    name: string;

    /**
     * Slug of the event, as its represented in the URL.
     */
    slug: string;

    /**
     * Start and end times of the event, to contextualize the card further. Represented in Temporal
     * `ZonedDateTime`-compatible formatting in UTC.
     */
    startTime: string;
    endTime: string;

    /**
     * Location in which the event will be hosted, if any.
     */
    location?: string;

    /**
     * File hash of the event's identity image, if any.
     */
    fileHash?: string;
}

/**
 * Props accepted by the <AccessibleEventCard> component.
 */
export interface AccessibleEventCardProps {
    /**
     * The event that should be displayed on this page.
     */
    accessibleEvent: AccessibleEvent;
}

/**
 * The <AccessibleEventCard> component displays a singular accessible event on the dashboard, with
 * basic information and the ability to quickly click through to its specific dashboard.
 */
export function AccessibleEventCard(props: AccessibleEventCardProps) {
    const event = props.accessibleEvent;

    const startTime = Temporal.ZonedDateTime.from(event.startTime);
    const endTime = Temporal.ZonedDateTime.from(event.endTime);

    let timespan: string;
    if (startTime.month === endTime.month)
        timespan = `${formatDate(startTime, 'MMMM D')}–${formatDate(endTime, 'D')}`;
    else
        timespan = `${formatDate(startTime, 'MMMM D')} until ${formatDate(endTime, 'MMMM D')}`;

    const router = useRouter();

    const image = event.fileHash ? `/blob/${event.fileHash}.png`
                                 : '/images/admin/event-header.jpg';

    return (
        <Card>
            <CardMedia sx={{ aspectRatio: 2, backgroundPositionY: '25%' }}
                       image={image} title={event.name}
                       onClick={ () => router.push(`/admin/events/${event.slug}`) }/>
            <CardContent sx={{ pb: '8px !important' }}>
                <Typography variant="h5" sx={{ pb: 1 }} noWrap>
                    {event.name}
                </Typography>
                <Typography variant="body2">
                    Taking place {timespan}, {formatDate(startTime, 'YYYY')}
                    { !!event.location && `, in ${event.location}.` }
                    { !event.location && '.' }
                </Typography>
                <Button startIcon={ <ArrowForwardIcon /> } sx={{ ml: -1, mt: 1 }}
                        onClick={ () => router.push(`/admin/events/${event.slug}`) }>
                    Go to event
                </Button>
            </CardContent>
        </Card>
    )
}
