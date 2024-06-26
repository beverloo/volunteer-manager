// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';

import type { SxProps } from '@mui/system';
import type { Theme } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import EventNoteIcon from '@mui/icons-material/EventNote';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

/**
 * Manual styles that apply to the <AdditionalEventCard> client component.
 */
const kStyles: SxProps<Theme> = {
    alignItems: 'start',
    flexDirection: 'column',
    pt: { md: 2 },

    '&>a>:first-of-type': { px: 1 },
    '&>:not(:first-of-type)': {
        px: 0,
        m: 0,
    },
};

/**
 * Props accepted by the <AdditionalEventCard> component.
 */
interface AdditionalEventCardProps {
    /**
     * Whether a link to the registration portal should be made available.
     */
    enableRegistration?: boolean;

    /**
     * Whether a link to the schedule should be made available.
     */
    enableSchedule?: boolean;

    /**
     * Name of the event for which this card is being shown.
     */
    name: string;

    /**
     * Unique slug of the event, through which its content can be accessed.
     */
    slug: string;
}

/**
 * Card that links through to an additional event that's not featured on the main overview card,
 * usually events that happened at some point in the past but are being included for historical
 * reference. Inclusion is determined by the SSR app.
 */
export function AdditionalEventCard(props: AdditionalEventCardProps) {
    return (
        <Card elevation={2}>
            <CardContent sx={{ pb: 0 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="h5" component="p" noWrap>
                        {props.name}
                    </Typography>
                </Stack>
            </CardContent>
            <CardActions sx={kStyles}>
                { !!props.enableRegistration &&
                    <Link href={`/registration/${props.slug}/`} passHref>
                        <Button size="small" startIcon={ <HowToRegIcon />}>
                            Registration
                        </Button>
                    </Link> }
                { !!props.enableSchedule &&
                    <Link href={`/schedule/${props.slug}/`} passHref>
                        <Button size="small" startIcon={ <EventNoteIcon />}>
                            Volunteer Portal
                        </Button>
                    </Link> }
            </CardActions>
        </Card>
    );
}
