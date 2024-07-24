// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Link from 'next/link';
import { notFound } from 'next/navigation';

import { default as MuiLink } from '@mui/material/Link';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

import type { NextPageParams } from '@lib/NextRouterParams';
import { Markdown } from '@components/Markdown';
import { RegistrationAlert } from '@components/RegistrationAlert';
import { contextForRegistrationPage } from '../contextForRegistrationPage';
import { generatePortalMetadataFn } from '../../generatePortalMetadataFn';
import { getContent } from '@lib/Content';
import db, { tTeams, tUsersEvents } from '@lib/database';
import { RegistrationStatus } from '@lib/database/Types';

/**
 * When the number of participating volunteers exceeds this proportion of a team's capacity, a
 * warning will be shown to unregistered visitors of this page that they should make up their mind.
 */
const kTeamCapacityWarningRatio = 0.8;

/**
 * The <EventContentPage> component displays arbitrary content for a particular event. Senior+
 * volunteers can freely create content as they see fit, which will be served by this component.
 */
export default async function EventContentPage(props: NextPageParams<'slug', 'path'>) {
    const { path, slug } = props.params;

    const context = await contextForRegistrationPage(slug);
    if (!context)
        notFound();

    const { access, event, environment, registration, user } = context;

    const content = await getContent(environment.environmentName, event, path ?? []);
    const environmentData = event.getEnvironmentData(environment.environmentName);

    if (!content || !environmentData)
        notFound();

    if (path && path.length > 0) {
        return (
            <Stack spacing={2} sx={{ p: 2 }}>
                <Markdown>{content.markdown}</Markdown>
                <MuiLink component={Link} href={`/registration/${slug}`}>
                    « Previous page
                </MuiLink>
            </Stack>
        );
    }

    let capacity: 'lots' | 'few' | 'none' = 'lots';
    if (!!environmentData.maximumVolunteers) {
        const usersEventsJoin = tUsersEvents.forUseInLeftJoin();

        const currentVolunteers = await db.selectFrom(tTeams)
            .leftJoin(usersEventsJoin)
                .on(usersEventsJoin.teamId.equals(tTeams.teamId))
                    .and(usersEventsJoin.eventId.equals(event.id))
                    .and(usersEventsJoin.registrationStatus.equals(RegistrationStatus.Accepted))
            .where(tTeams.teamEnvironment.equals(environment.environmentName))
            .selectCountAll()
            .groupBy(tTeams.teamId)
            .executeSelectNoneOrOne() || 0;

        if (currentVolunteers >= environmentData.maximumVolunteers)
            capacity = 'none';
        else if (currentVolunteers >= environmentData.maximumVolunteers * kTeamCapacityWarningRatio)
            capacity = 'few';
    }

    const enableApplications =
        (
            environmentData.enableApplications ||
            access.can('event.applications', 'create', {
                event: event.slug, team: environment.teamSlug
            })
        ) &&
        capacity !== 'none';

    return (
        <Stack spacing={2} sx={{ p: 2 }}>
            { (!registration && !!enableApplications && capacity === 'few') &&
                <RegistrationAlert severity="warning">
                    Our team is nearly complete, but there's still room for a few more members. If
                    you're interested in joining, please decide soon to secure your spot!
                </RegistrationAlert> }
            { (!registration && !enableApplications) &&
                <RegistrationAlert severity="error">
                    We are currently not accepting applications for {event.shortName}. If you have
                    any questions, please feel free to e-mail us at{' '}
                    <MuiLink href="mailto:crew@animecon.nl">crew@animecon.nl</MuiLink>.
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
