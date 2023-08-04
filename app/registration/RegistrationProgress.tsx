// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';

import type { SxProps, Theme } from '@mui/system';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import DoNotDisturbAltIcon from '@mui/icons-material/DoNotDisturbAlt';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HotelIcon from '@mui/icons-material/Hotel';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import IconButton from '@mui/material/IconButton';
import PlaylistRemoveIcon from '@mui/icons-material/PlaylistRemove';
import Stack from '@mui/material/Stack';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { lighten } from '@mui/material/styles';
import lightGreen from '@mui/material/colors/lightGreen'
import red from '@mui/material/colors/red';
import yellow from '@mui/material/colors/yellow';

import { type EventData } from '@app/lib/Event';
import { type RegistrationData } from '@app/lib/Registration';

// CSS customizations applied to the <RegistrationProgress> component.
const kStyles: { [key: string]: SxProps<Theme> } = {
    containerAccepted: { backgroundColor: lightGreen[200] },
    containerRegistered: { backgroundColor: yellow[100] },
    containerRejected: { backgroundColor: theme => lighten(theme.palette.error.main, .8) },

    divider: { marginBottom: 1 },

    summary: {
        minHeight: 'auto',

        '& .MuiAccordionSummary-content': {
            marginTop: 1,
            marginBottom: 0.8,
        },
    },

    summaryIcon: {
        lineHeight: 'normal',
        paddingRight: 1,
        paddingTop: '1px',
    },

    details: {
        paddingTop: 0,
        paddingRight: 2,
        paddingBottom: 1,
        paddingLeft: 2,
    },
};

/**
 * Component to display the progress of an accepted registration. The layout of this is a little bit
 * more complicated than the other messages, as the volunteer may have the ability to indicate their
 * hotel and availability preferences.
 */
function AcceptedRegistrationProgress(props: { event: EventData, registration: RegistrationData }) {
    const { event, registration } = props;

    let minWidth = 0;
    if (registration.availabilityEligible || registration.availability)
        minWidth += 48;
    if (registration.hotelEligible || registration.hotel)
        minWidth += 48;

    let extraDescription = '';
    if (registration.availabilityEligible && !registration.availability) {
        extraDescription += 'Please share your availability with us';
        if (registration.hotelEligible && !registration.hotel)
            extraDescription += ', and whether you would like to book a hotel room.';
        else
            extraDescription += '.';
    } else if (registration.hotelEligible && !registration.hotel) {
        extraDescription += 'Please share whether you would like to book a hotel room.';
    }

    return (
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Typography variant="body2">
                We're very happy with your application and your participation during
                <strong> {event.name}</strong> has been confirmed! {extraDescription}
            </Typography>
            <Box sx={{ minWidth }}>
                { (registration.availabilityEligible || registration.availability) &&
                    <Tooltip title="Your availability">
                        <IconButton component={Link}
                                    href={`/registration/${event.slug}/application/availability`}
                                    color={registration.availability ? 'default' : 'error'}
                                    size="large">
                            <PlaylistRemoveIcon
                                htmlColor={ registration.availability ? undefined : red[800] } />
                        </IconButton>
                    </Tooltip> }
                { (registration.hotelEligible || registration.hotel) &&
                    <Tooltip title="Hotel booking">
                        <IconButton component={Link}
                                    href={`/registration/${event.slug}/application/hotel`}
                                    color={registration.hotel ? 'default' : 'error'}
                                    size="large">
                            <HotelIcon
                                htmlColor={ registration.hotel ? undefined : red[800] } />
                        </IconButton>
                    </Tooltip> }
            </Box>
        </Stack>
    );
}

/**
 * Props accepted by the <RegistrationProgress> component.
 */
export interface RegistrationProgressProps {
    /**
     * The event for which the given `registration` applies.
     */
    event: EventData;

    /**
     * The registration of the volunteer who wishes to participate in this event.
     */
    registration: RegistrationData;
}

/**
 * The <RegistrationProgress> component displays the progression of a volunteer's participation in
 * a particular event, including the information we'd like to request from them.
 */
export function RegistrationProgress(props: RegistrationProgressProps) {
    const { event, registration } = props;

    let containerStyle: SxProps<Theme>;

    // TODO: Session-persistent open/close toggle

    let icon: React.ReactNode;
    let title: React.ReactNode;
    let explanation: React.ReactNode;

    switch (registration.status) {
        case 'Registered':
            containerStyle = kStyles.containerRegistered;
            icon = <HowToVoteIcon style={{ color: yellow[900] }} fontSize="inherit" />;
            title = <>Your application is <b>being considered</b>.</>;
            explanation = (
                <Typography variant="body2">
                    We have received your application for <strong>{event.name}</strong> and have
                    it under consideration. We will confirm your participation as soon as we can.
                    Please feel free to send us a message in case you have any questions.
                </Typography>
            );

            break;

        case 'Cancelled':
            containerStyle = kStyles.containerRejected;
            icon = <DoNotDisturbAltIcon style={{ color: red[800] }} fontSize="inherit" />;
            title = <>Your participation has been <b>cancelled</b>.</>;
            explanation = (
                <Typography variant="body2">
                    Unfortunately you've withdrawn from participating in the
                    <strong> {event.name}</strong> team. We hope to welcome you next time!
                </Typography>
            );

            break;

        case 'Accepted':
            containerStyle = kStyles.containerAccepted;
            icon = <ThumbUpIcon style={{ color: lightGreen[900] }} fontSize="inherit" />;
            title = <>Your participation has been <b>confirmed</b> ({registration.role}).</>;
            explanation =
                <AcceptedRegistrationProgress event={event} registration={registration} />;
            break;

        case 'Rejected':
            containerStyle = kStyles.containerRejected;
            icon = <DoNotDisturbAltIcon style={{ color: red[800] }} fontSize="inherit" />;
            title = <>Your participation has been <b>declined</b>.</>;
            explanation = (
                <Typography variant="body2">
                    Unfortunately we have not been able to offer you participation in the
                    <strong> {event.name}</strong> team. You have received a message with more
                    information.
                </Typography>
            );

            break;
    }

    return (
        <Accordion sx={containerStyle} disableGutters>
            <AccordionSummary sx={kStyles.summary} expandIcon={<ExpandMoreIcon />}>
                <Box sx={kStyles.summaryIcon}>
                    {icon}
                </Box>
                <Typography variant="body2">
                    {title}
                </Typography>
            </AccordionSummary>
            <AccordionDetails sx={kStyles.details}>
                <Divider sx={kStyles.divider} />
                {explanation}
            </AccordionDetails>
        </Accordion>
    );
}
