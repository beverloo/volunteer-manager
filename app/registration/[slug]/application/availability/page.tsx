// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Link from 'next/link';
import { notFound } from 'next/navigation';

import { default as MuiLink } from '@mui/material/Link';
import Box from '@mui/material/Box';

import type { NextRouterParams } from '@lib/NextRouterParams';
import { Markdown } from '@components/Markdown';
import { Privilege, can } from '@lib/auth/Privileges';
import { contextForRegistrationPage } from '../../contextForRegistrationPage';
import { generatePortalMetadataFn } from '../../../generatePortalMetadataFn';
import { getStaticContent } from '@lib/Content';

/**
 * The <EventApplicationAvailabilityPage> component enables our volunteers to indicate when they
 * will be around at the festival, and which events they really want to attend.
 */
export default async function EventApplicationAvailabilityPage(props: NextRouterParams<'slug'>) {
    const context = await contextForRegistrationPage(props.params.slug);
    if (!context || !context.registration || !context.user)
        notFound();  // the event does not exist, or the volunteer is not signed in

    const { environment, event, registration, user } = context;

    const eligible = registration.availabilityEligible;
    const enabled = registration.availabilityAvailable || can(user, Privilege.EventAdministrator);
    const preferences = null;

    if ((!eligible || !enabled) && !preferences)
        notFound();  // the volunteer is not eligible to indicate their preferences

    const content = await getStaticContent([ 'registration', 'application', 'availability' ], {
        firstName: user.firstName,
    });

    // TODO: Logic goes here.

    return (
        <Box sx={{ p: 2 }}>
            { content && <Markdown>{content.markdown}</Markdown> }
            { /* TODO: Page content */ }

            <MuiLink component={Link} href={`/registration/${event.slug}/application`}>
                « Back to your registration
            </MuiLink>
        </Box>
    );
}

export const generateMetadata = generatePortalMetadataFn('Availability preferences');
