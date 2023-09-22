// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';

import type { Content } from '@lib/Content';
import type { EventData } from '@lib/Event';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { default as MuiLink } from '@mui/material/Link';

import { Markdown } from '@components/Markdown';

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
     * Whether the registration button should be shown on an active event page.
     */
    showRegistrationButton?: boolean;

    /**
     * Whether the registration button should be enabled. (Avoid letting people apply twice.)
     */
    enableRegistrationButton?: boolean;
}

/**
 * The <RegistrationContent> page represents a plain old content page that takes Markdown input and
 * shares information with the user towards their application for an event.
 */
export function RegistrationContent(props: RegistrationContentProps) {
    return (
        <>
            <Markdown sx={{ p: 2 }}>
                {props.content.markdown}
            </Markdown>
            { props.backUrl &&
                <Box sx={{ mt: -2, p: 2 }}>
                    <MuiLink component={Link} href={props.backUrl}>« Previous page</MuiLink>
                </Box> }
            {(props.showRegistrationButton && props.event) &&
                <Box sx={{ mt: -2, p: 2 }}>
                    <Button color={props.enableRegistrationButton ? 'primary' : 'inherit'}
                            component={Link}
                            href={`/registration/${props.event.slug}/application`}
                            variant="contained">
                        { !props.enableRegistrationButton && 'See the status of your application' }
                        { props.enableRegistrationButton &&
                            `Join the ${props.event.shortName} team today!` }
                    </Button>
                </Box> }
        </>
    );
}
