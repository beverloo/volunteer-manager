// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import Box from '@mui/material/Box';
import SendIcon from '@mui/icons-material/Send';

import type { EnvironmentContext, EnvironmentContextEventAccess } from '@lib/EnvironmentContext';
import type { NextPageParams } from '@lib/NextRouterParams';
import { EventApplicationForm, type EventApplicationFormProps } from './EventApplicationForm';
import { FormProvider } from '@components/FormProvider';
import { FormSubmitButton } from '@components/FormSubmitButton';
import { Markdown } from '@components/Markdown';
import { determineEnvironment, type Environment } from '@lib/Environment';
import { generatePortalMetadataFn } from '../../generatePortalMetadataFn';
import { getContent, getStaticContent } from '@lib/Content';
import { getEnvironmentContext } from '@lib/EnvironmentContext';
import db, { tEnvironments, tEvents, tTeams, tUsersEvents } from '@lib/database';

import { kRegistrationStatus, type ShirtFit, type ShirtSize } from '@lib/database/Types';

import * as actions from './ApplicationActions';

/**
 * The <EventApplicationPage> serves three purposes: first, to explain when applications aren't
 * being presently considerer, second, to accept applications, and third, to inform the visitor of
 * the status of their application in case one has already been made.
 */
export default async function EventApplicationPage(props: NextPageParams<'slug'>) {
    const environment = await determineEnvironment();
    if (!environment)
        notFound();

    const params = await props.params;

    const context = await getEnvironmentContext(environment);
    const event = context.events.find(event => event.slug === params.slug);

    if (!event)
        notFound();

    // TODO: Enable applying multiple times on the same environment?

    if (event.applications.length > 0) {
        return <EventApplicationStatusPage context={context} environment={environment}
                                           event={event} />;
    }

    const { access } = context;

    const acceptsApplications = event.teams.some(team => {
        if (team.applications === 'active' || team.applications === 'override')
            return true;

        if (access.can('event.applications', 'create', { event: event.slug, team: team.slug }))
            return true;

        return false;
    });

    return acceptsApplications
        ? <EventApplicationFormPage context={context} environment={environment} event={event} />
        : <EventApplicationNotAvailablePage />;
}

/**
 * Props available to the specialised sub-pages of the <EventApplicationPage> component.
 */
interface EventApplicationSpecialisedProps {
    /**
     * Context for which the page is being rendered.
     */
    context: EnvironmentContext;

    /**
     * Environment for which the page is being rendered.
     */
    environment: Environment;

    /**
     * Event for which the page is being rendered.
     */
    event: EnvironmentContextEventAccess;
}

/**
 * The <EventApplicationNotAvailablePage> page informs the visitor that applications are presently
 * closed, and that they may want to try again at a later point in time.
 */
async function EventApplicationNotAvailablePage() {
    const content = await getStaticContent([ 'registration', 'application', 'unavailable' ]);
    return (
        <Markdown sx={{ p: 2 }}>{content?.markdown}</Markdown>
    );
}

/**
 * The <EventApplicationFormPage> page enables the visitor to apply to join one of our teams. Data
 * is being checked in this method, after which the form defers to sub-components.
 */
async function EventApplicationFormPage(props: EventApplicationSpecialisedProps) {
    const { environment, context, event } = props;

    const dbInstance = db;

    // ---------------------------------------------------------------------------------------------
    // Determine the team to whom the application should be made. This is, by default, the team that
    // manages the content, but can be overridden by special direct-apply links.
    // ---------------------------------------------------------------------------------------------

    const applicationTeamId = await dbInstance.selectFrom(tTeams)
        .where(tTeams.teamSlug.in(environment.teams))
            .and(tTeams.teamFlagManagesContent.equals(/* true= */ 1))
        .selectOneColumn(tTeams.teamId)
        .orderBy(tTeams.teamId, 'asc')  // arbitrary, but stable
        .limit(1)
        .executeSelectNoneOrOne();

    if (!applicationTeamId)
        notFound();

    // TODO: Enable a mechanism to apply to a non-default team instead.

    // ---------------------------------------------------------------------------------------------
    // Determine context for the form, both to prepopulate known fields and to refer to applications
    // they may have in progress with teams on other environments.
    // ---------------------------------------------------------------------------------------------

    type HistoricPreferences = {
        tshirtFit?: ShirtFit;
        tshirtSize?: ShirtSize;
    };

    let historicPreferences: HistoricPreferences | undefined;
    let partnerApplications: EventApplicationFormProps['partnerApplications'] = [ /* none yet */ ];

    if (!!context.user) {
        historicPreferences = await dbInstance.selectFrom(tUsersEvents)
            .innerJoin(tEvents)
                .on(tEvents.eventId.equals(tUsersEvents.eventId))
            .where(tUsersEvents.userId.equals(context.user.userId))
            .select({
                tshirtFit: tUsersEvents.shirtFit,
                tshirtSize: tUsersEvents.shirtSize,
            })
            .orderBy(tEvents.eventStartTime, 'desc')
            .limit(1)
            .executeSelectNoneOrOne() ?? undefined;

        partnerApplications = await dbInstance.selectFrom(tUsersEvents)
            .innerJoin(tTeams)
                .on(tTeams.teamId.equals(tUsersEvents.teamId))
            .innerJoin(tEnvironments)
                .on(tEnvironments.environmentId.equals(tTeams.teamEnvironmentId))
            .where(tUsersEvents.userId.equals(context.user.userId))
                .and(tUsersEvents.eventId.equals(event.id))
                .and(tUsersEvents.registrationStatus.in(
                    [ kRegistrationStatus.Registered, kRegistrationStatus.Accepted ]))
            .select({
                href:
                    dbInstance.const('https://', 'string')
                        .concat(tEnvironments.environmentDomain)
                        .concat('/registration/')
                        .concat(event.slug),
                status: tUsersEvents.registrationStatus,
                team: tTeams.teamName,

                environment: tTeams.teamEnvironment,
            })
            .orderBy(tTeams.teamName, 'asc')
            .executeSelectMany();
    }

    // ---------------------------------------------------------------------------------------------

    const action = actions.createApplication.bind(null, event.id, applicationTeamId);
    const content = await getContent(environment.domain, event.id, [ 'application' ]);

    // Set default values for the application form. These may be further contextualised with the
    // volunteer's historic preferences if they've applied before, for e.g. their t-shirt size.
    const defaultValues = {
        availability: true,
        credits: true,
        serviceHours: '16',
        serviceTiming: '10-0',
        socials: true,
        ...historicPreferences,
    };

    return (
        <FormProvider action={action} defaultValues={defaultValues}>
            <Box sx={{ p: 2 }}>
                { !!content && <Markdown sx={{ pb: 2 }}>{content.markdown}</Markdown> }

                <EventApplicationForm eventShortName={event.shortName}
                                      partnerApplications={partnerApplications}
                                      user={context.user} />

                <FormSubmitButton callToAction="Submit application" startIcon={ <SendIcon /> }
                                  sx={{ mt: 2 }} />
            </Box>
        </FormProvider>
    );
}

/**
 * The <EventApplicationStatusPage> page represents the case in which a visitor has one of more
 * active applications, the status of which can be displayed.
 */
async function EventApplicationStatusPage(props: EventApplicationSpecialisedProps) {
    // TODO: Single application case
    // TODO: Multiple application case

    return (
        <>
            TODO
        </>
    );
}

export const generateMetadata = generatePortalMetadataFn('Application');
