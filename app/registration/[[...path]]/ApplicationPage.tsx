// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useContext } from 'react';

import type { SxProps, Theme } from '@mui/system';
import Box from '@mui/material/Box';
import FaceIcon from '@mui/icons-material/Face';
import MuiAvatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { lighten } from '@mui/system/colorManipulator';

import { type Content } from '@lib/Content';
import { type EventData } from '@lib/Event';
import { type RegistrationInfo } from '../Registration';
import { type UserData } from '@app/lib/auth/UserData';
import { AuthenticationContext } from '../AuthenticationContext';
import { Avatar } from '@components/Avatar';
import { Markdown } from '@components/Markdown';

/**
 * Manual styles that apply to the <ApplicationPage> client component.
 */
export const kStyles: { [key: string]: SxProps<Theme> } = {
    identity: {
        paddingBottom: 2,
        '& > .MuiBox-root': {
            width: 'fit-content',
            cursor: 'pointer',
            borderRadius: 1,
            padding: 1,
            paddingRight: 2,
            transition: 'background-color 0.3s ease-in-out',
        },
    },
    identityKnown: {
        backgroundColor: (theme) => lighten(theme.palette.primary.main, 0.75),
        '&:hover': {
            backgroundColor: (theme) => lighten(theme.palette.primary.main, 0.85),
        },
    },
    identityUnknown: {
        backgroundColor: 'grey.300',
        '&:hover': {
            backgroundColor: 'grey.200',
        },
    },
};

/**
 * Props accepted by the <ApplicationPage> component.
 */
export interface ApplicationPageProps {
    /**
     * The content that should be displayed on the registration page.
     */
    content?: Content;

    /**
     * The event for which data is being displayed on this page.
     */
    event: EventData;

    /**
     * Information about the user's existing registration.
     */
    registration?: RegistrationInfo;

    /**
     * The user who is currently signed in. We require someone to be signed in when applying, as
     * it helps carry their participation information across multiple events.
     */
    user?: UserData;
}

/**
 * The <ApplicationPage> component makes it possible for people to apply to join a particular event.
 * A whole bunch of checks will have to be done in order to verify that they can.
 */
export function ApplicationPage(props: ApplicationPageProps) {
    const { user } = props;

    const authenticationContext = useContext(AuthenticationContext);
    const requestAuthenticationFlow = useCallback(() => {
        authenticationContext.requestAuthenticationFlow();
    }, [ authenticationContext ])

    // TODO: State - signed out
    // TODO: State - signed in but unregistered
    // TODO: State - signed in and registered

    return (
        <>
            <Box sx={{ p: 2 }}>
                {props.content && <Markdown sx={{ pb: 2 }}>{props.content.markdown}</Markdown> }

                <Typography variant="h6">
                    Personal information
                </Typography>

                <Box sx={kStyles.identity}>
                    { user &&
                        <Box sx={kStyles.identityKnown} onClick={requestAuthenticationFlow}>
                            <Stack alignItems="center" direction="row" spacing={2}>
                                <Avatar src={user.avatarUrl}>
                                    {user.firstName} {user.lastName}
                                </Avatar>
                                <Typography variant="h6">
                                    {user.firstName} {user.lastName}
                                </Typography>
                            </Stack>
                        </Box> }

                    { !user &&
                        <Box sx={kStyles.identityUnknown} onClick={requestAuthenticationFlow}>
                            <Stack alignItems="center" direction="row" spacing={2}>
                                <MuiAvatar>
                                    <FaceIcon />
                                </MuiAvatar>
                                <Typography>
                                    Please sign in or create an account
                                </Typography>
                            </Stack>
                        </Box> }
                </Box>

                <Typography variant="h6">
                    Participation
                </Typography>
                { /* TODO */ }

                <Typography variant="h6">
                    Paperwork
                </Typography>
                { /* TODO */ }
            </Box>
        </>
    );
}
