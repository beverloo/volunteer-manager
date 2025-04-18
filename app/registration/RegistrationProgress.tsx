// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { SxProps } from '@mui/system';
import type { Theme } from '@mui/material/styles';
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

import { darken, lighten } from '@mui/material/styles';
import { deepmerge } from '@mui/utils';
import { green, red, yellow } from '@mui/material/colors';

import type { EventData } from '@lib/Event';
import type { RegistrationData } from '@lib/Registration';

import { kRegistrationStatus } from '@lib/database/Types';


/**
 * Name of the state, stored in local storage, indicating whether the progress bar should be open.
 */
const kProgressExpansionStateName = 'vm-progress-expanded';

/**
 * CSS customizations applied to the <RegistrationProgress> component.
 */
const kStyles: { [key: string]: SxProps<Theme> } = {
    root: { position: 'relative' },

    containerAccepted: {
        '& svg': { color: theme => theme.palette.mode === 'light' ? green[900] : green[400] },
        backgroundColor:
            theme => theme.palette.mode === 'light' ? lighten(theme.palette.success.main, 0.75)
                                                    : darken(theme.palette.success.main, 0.6),
    },

    containerCancelledOrRejected: {
        '& svg': { color: theme => theme.palette.mode === 'light' ? red[800] : red[400] },
        backgroundColor:
            theme => theme.palette.mode === 'light' ? lighten(theme.palette.error.main, 0.8)
                                                    : darken(theme.palette.error.main, 0.7),
    },

    containerRegistered: {
        '& svg': { color: theme => theme.palette.mode === 'light' ? yellow[900] : yellow[300] },
        backgroundColor:
            theme => theme.palette.mode === 'light' ? lighten(theme.palette.warning.main, 0.87)
                                                    : darken(theme.palette.warning.main, 0.75),
    },

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
interface RegistrationProgressProps {
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
        (registration.trainingEligible &&
            (registration.trainingInformationPublished && !registration.training)) ||
        (registration.hotelEligible &&
            (registration.hotelInformationPublished && !registration.hotelPreferences &&
             !registration.hotelBookings.length));

    const navigateToRegistration = useCallback(() => {
        router.push(`/registration/${event.slug}/application`);
    }, [ event, router ]);

    return (
        <Paper sx={deepmerge(kStyles.containerAccepted, kStyles.root)} elevation={1} square={true}
               onClick={navigateToRegistration}>

            <AccordionSummary sx={deepmerge(kStyles.summary, kStyles.summaryAccepted)}>
                <Box sx={{ display: 'flex' }}>
                    <Box sx={kStyles.summaryIcon}>
                        <ThumbUpIcon fontSize="inherit" />
                    </Box>
                    <Typography variant="body2">
                        Your participation has been <b>confirmed</b>
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

    if (registration.status === kRegistrationStatus.Accepted)
        return <RegistrationProgressAccepted {...props} />;

    let containerStyle: SxProps<Theme>;
    let icon: React.ReactNode;
    let title: React.ReactNode;
    let explanation: React.ReactNode;

    switch (registration.status) {
        case kRegistrationStatus.Registered:
            containerStyle = kStyles.containerRegistered;
            icon = <HowToVoteIcon fontSize="inherit" />;
            title = <>Your application is <b>being considered</b></>;
            explanation = (
                <Typography variant="body2">
                    We have received your application for <strong>{event.name}</strong> and have
                    it under consideration. We will confirm your participation as soon as we can.
                    Please feel free to send us a message in case you have any questions.
                </Typography>
            );

            break;

        case kRegistrationStatus.Cancelled:
            containerStyle = kStyles.containerCancelledOrRejected;
            icon = <DoNotDisturbAltIcon fontSize="inherit" />;
            title = <>Your participation has been <b>cancelled</b></>;
            explanation = (
                <Typography variant="body2">
                    Unfortunately you've withdrawn from participating in the
                    <strong> {event.name}</strong> team. We hope to welcome you next time!
                </Typography>
            );

            break;

        case kRegistrationStatus.Rejected:
            containerStyle = kStyles.containerCancelledOrRejected;
            icon = <DoNotDisturbAltIcon fontSize="inherit" />;
            title = <>Your participation has been <b>declined</b></>;
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
