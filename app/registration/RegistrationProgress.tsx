// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { SxProps, Theme } from '@mui/system';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Button from '@mui/material/Button';
import DoNotDisturbAltIcon from '@mui/icons-material/DoNotDisturbAlt';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import Paper from '@mui/material/Paper';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import Typography from '@mui/material/Typography';

import { lighten } from '@mui/material/styles';
import { deepmerge } from '@mui/utils';
import lightGreen from '@mui/material/colors/lightGreen'
import red from '@mui/material/colors/red';
import yellow from '@mui/material/colors/yellow';

import { type EventData } from '@app/lib/Event';
import { type RegistrationData } from '@app/lib/Registration';


/**
 * Name of the state, stored in local storage, indicating whether the progress bar should be open.
 */
const kProgressExpansionStateName = 'vm-progress-expanded';

/**
 * CSS customizations applied to the <RegistrationProgress> component.
 */
const kStyles: { [key: string]: SxProps<Theme> } = {
    root: { position: 'relative' },

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

    summaryAccepted: {
        '& .MuiAccordionSummary-content': {
            alignItems: 'center',
            justifyContent: 'space-between',
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
 * Specialization of the <RegistrationProgress> component that will only be used when the
 * registration has been accepted. Details are shown on a more detailed page instead.
 */
export function RegistrationProgressAccepted(props: RegistrationProgressProps) {
    const { event, registration } = props;

    const router = useRouter();
    const missingInformation =
        (registration.availabilityAvailable && !registration.availability) ||
        (registration.hotelEligible && (registration.hotelAvailable && !registration.hotel));

    const navigateToRegistration = useCallback(() => {
        router.push(`/registration/${event.slug}/application`);
    }, [ event, router ]);

    return (
        <Paper sx={deepmerge(kStyles.containerAccepted, kStyles.root)} elevation={1} square={true}
               onClick={navigateToRegistration}>

            <AccordionSummary sx={deepmerge(kStyles.summary, kStyles.summaryAccepted)}>
                <Box sx={{ display: 'flex' }}>
                    <Box sx={kStyles.summaryIcon}>
                        <ThumbUpIcon style={{ color: lightGreen[900] }} fontSize="inherit" />
                    </Box>
                    <Typography variant="body2">
                        Your participation has been <b>confirmed</b> ({registration.role}).
                    </Typography>
                </Box>

                { missingInformation &&
                    <Button size="small" color="inherit" endIcon={ <NavigateNextIcon /> }>
                        Complete registration
                    </Button> }

                { !missingInformation && <NavigateNextIcon fontSize="small" /> }

            </AccordionSummary>

        </Paper>
    );
}

/**
 * The <RegistrationProgress> component displays the progression of a volunteer's participation in
 * a particular event, including the information we'd like to request from them.
 */
export function RegistrationProgress(props: RegistrationProgressProps) {
    const { event, registration } = props;

    const defaultOpen =
        !(typeof window !== 'undefined' && window.sessionStorage &&
          window.sessionStorage.getItem(kProgressExpansionStateName) === 'false');

    const [ open, setOpen ] = useState<boolean>(defaultOpen);

    function onProgressChange(event: React.SyntheticEvent, expanded: boolean) {
        try {
            sessionStorage.setItem(kProgressExpansionStateName, `${expanded}`);
            setOpen(expanded);

        } catch (e) { /* thanks, Safari */ }
    }

    if (registration.status === 'Accepted')
        return <RegistrationProgressAccepted {...props} />;

    let containerStyle: SxProps<Theme>;
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
        <Accordion onChange={onProgressChange} expanded={open} sx={containerStyle} disableGutters>
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
