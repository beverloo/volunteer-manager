// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import type { SxProps, Theme } from '@mui/system';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import DoNotDisturbAltIcon from '@mui/icons-material/DoNotDisturbAlt';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
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
    // TODO: Availability selection
    // TODO: Hotel room selection

    let icon: React.ReactNode;
    let title: React.ReactNode;
    let explanation: React.ReactNode;

    switch (registration.status) {
        case 'Registered':
            containerStyle = kStyles.containerRegistered;
            icon = <HowToVoteIcon style={{ color: yellow[900] }} fontSize="inherit" />;
            title = <>Your application is <b>being considered</b>.</>;
            explanation = (
                <>
                    We have received your application for <strong>{event.name}</strong> and have
                    it under consideration. We will confirm your participation as soon as we can.
                    Please feel free to send us a message in case you have any questions.
                </>
            );

            break;

        case 'Cancelled':
            containerStyle = kStyles.containerRejected;
            icon = <DoNotDisturbAltIcon style={{ color: red[800] }} fontSize="inherit" />;
            title = <>Your participation has been <b>cancelled</b>.</>;
            explanation = (
                <>
                    Unfortunately you've withdrawn from participating in the
                    <strong> {event.name}</strong> team. We hope to welcome you next time!
                </>
            );

            break;

        case 'Accepted':
            containerStyle = kStyles.containerAccepted;
            icon = <ThumbUpIcon style={{ color: lightGreen[900] }} fontSize="inherit" />;
            title = <>Your participation has been <b>confirmed</b> ({registration.role}).</>;
            explanation = (
                <>
                    We're very happy with your application and your participation during
                    <strong> {event.name}</strong> has been confirmed. You have received a
                    message with more information.
                </>
            );

            break;

        case 'Rejected':
            containerStyle = kStyles.containerRejected;
            icon = <DoNotDisturbAltIcon style={{ color: red[800] }} fontSize="inherit" />;
            title = <>Your participation has been <b>declined</b>.</>;
            explanation = (
                <>
                    Unfortunately we have not been able to offer you participation in the
                    <strong> {event.name}</strong> team. You have received a message with more
                    information.
                </>
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
                <Typography variant="body1">
                    {explanation}
                </Typography>
            </AccordionDetails>
        </Accordion>
    );
}
