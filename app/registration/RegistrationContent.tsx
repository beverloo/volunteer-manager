// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';
import { useState } from 'react';

import { type Content } from '@lib/Content';
import { type EventData } from '@lib/Event';
import { type RegistrationInfo } from './Registration';
import { type UserData } from '@lib/auth/UserData';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { default as MuiLink } from '@mui/material/Link';
import Paper from '@mui/material/Paper';

import { LazyAuthenticationFlow } from '../registration/LazyAuthenticationFlow';
import { Markdown } from '@components/Markdown';
import { RegistrationHeader } from './RegistrationHeader';

/**
 * Props accepted by the <RegistrationContent> page.
 */
export interface RegistrationContentProps {
    /**
     * When set, will append a link "back" to the given URL at the bottom of the content page.
     */
    backUrl?: string;

    /**
     * The content that should be displayed on the registration page.
     */
    content: Content;

    /**
     * The event for which data is being displayed on this page.
     */
    event?: EventData;

    /**
     * The volunteer's registration information, in case they have applied to participate in this
     * event. Also includes information about their requests and reservations.
     */
    registration?: RegistrationInfo;

    /**
     * Whether the registration button should be shown on an active event page.
     */
    showRegistrationButton?: boolean;

    /**
     * Title of the page. Will be overridden by the event's title when available.
     */
    title?: string;

    /**
     * Information about the signed in user, as they should be shown in the header.
     */
    user?: UserData;
}

/**
 * The <RegistrationContent> page represents a plain old content page that takes Markdown input and
 * shares information with the user towards their application for an event.
 */
export function RegistrationContent(props: RegistrationContentProps) {
    const title = props.event ? props.event.name
                              : (props.title ?? 'AnimeCon Volunteer Manager');

    const [ authFlowOpen, setAuthFlowOpen ] = useState<boolean>(false);
    return (
        <>
            <Paper elevation={2}>
                <RegistrationHeader onUserChipClick={() => setAuthFlowOpen(true)}
                                    title={title}
                                    user={props.user} />

                <Markdown sx={{ p: 2 }}>
                    {props.content.markdown}
                </Markdown>
                { props.backUrl &&
                    <Box sx={{ mt: -2, p: 2 }}>
                        <MuiLink component={Link} href={props.backUrl}>« Previous page</MuiLink>
                    </Box> }
                {(props.showRegistrationButton && props.event) &&
                    <Box sx={{ mt: -2, p: 2 }}>
                        <Button component={Link}
                                disabled={!!props.registration}
                                href={`/registration/${props.event.slug}/application`}
                                variant="contained">
                            Join the {props.event.shortName} team today!
                        </Button>
                    </Box> }
            </Paper>
            <LazyAuthenticationFlow onClose={() => setAuthFlowOpen(false)}
                                    open={authFlowOpen}
                                    user={props.user} />
        </>
    );
}
