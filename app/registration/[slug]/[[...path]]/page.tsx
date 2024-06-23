// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Link from 'next/link';
import { notFound } from 'next/navigation';

import { default as MuiLink } from '@mui/material/Link';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

import type { NextPageParams } from '@lib/NextRouterParams';
import { Privilege, can } from '@lib/auth/Privileges';
import { RegistrationAlert } from '@components/RegistrationAlert';
import { contextForRegistrationPage } from '../contextForRegistrationPage';
import { generatePortalMetadataFn } from '../../generatePortalMetadataFn';
import { getContent } from '@lib/Content';
import { Markdown } from '@components/Markdown';

/**
 * The <EventContentPage> component displays arbitrary content for a particular event. Senior+
 * volunteers can freely create content as they see fit, which will be served by this component.
 */
export default async function EventContentPage(props: NextPageParams<'slug', 'path'>) {
    const { path, slug } = props.params;

    const context = await contextForRegistrationPage(slug);
    if (!context)
        notFound();

    const { event, environment, registration } = context;

    const content = await getContent(environment.environmentName, event, path ?? []);
    const environmentData = event.getEnvironmentData(environment.environmentName);

    if (!content || !environmentData)
        notFound();

    if (path && path.length > 0) {
        return (
            <Stack spacing={2}>
                <Markdown>{content.markdown}</Markdown>
                <MuiLink component={Link} href={`/registration/${slug}`}>
                    « Previous page
                </MuiLink>
            </Stack>
        );
    }

    const enableApplications =
        environmentData.enableApplications || can(context.user, Privilege.EventApplicationOverride);

    return (
        <Stack spacing={2} sx={{ p: 2 }}>
            { (!registration && !enableApplications) &&
                <RegistrationAlert severity="error">
                    Unfortunately we are not accepting applications for {event.shortName} at this
                    time. E-mail us at{' '}
                    <MuiLink href="mailto:crew@animecon.nl">crew@animecon.nl</MuiLink> in case you
                    have questions.
                </RegistrationAlert> }
            <Markdown>{content.markdown}</Markdown>
            { (!registration && !!enableApplications) &&
                <Button component={Link} href={`/registration/${slug}/application`}
                        color="primary" variant="contained" sx={{ alignSelf: 'flex-start' }}>
                    Join the {event.shortName} team today!
                </Button> }
            { !!registration &&
                <Button component={Link} href={`/registration/${slug}/application`}
                        color="inherit" variant="contained" sx={{ alignSelf: 'flex-start' }}>
                    See the status of your application
                </Button> }
        </Stack>
    );
}

export const generateMetadata = generatePortalMetadataFn();
