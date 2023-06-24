// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';

import { type Content } from '@lib/Content';
import { type EventData } from '@lib/Event';
import { type RegistrationInfo } from './Registration';
import { type UserData } from '@lib/auth/UserData';

import Box from '@mui/material/Box';
import { default as MuiLink } from '@mui/material/Link';
import Paper from '@mui/material/Paper';

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
    event: EventData;

    /**
     * The volunteer's registration information, in case they have applied to participate in this
     * event. Also includes information about their requests and reservations.
     */
    registration?: RegistrationInfo;

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
    return (
        <Paper elevation={2}>
            <RegistrationHeader title={props.event.name} />
            <Markdown baseUrl={`/registration/${props.event.slug}/`} sx={{ p: 2 }}>
                {props.content.markdown}
            </Markdown>
            { props.backUrl &&
                <Box sx={{ mt: -2, p: 2 }}>
                    <MuiLink component={Link} href={props.backUrl}>« Previous page</MuiLink>
                </Box> }
        </Paper>
    );
}
