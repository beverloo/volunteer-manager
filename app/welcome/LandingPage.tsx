// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Grid from '@mui/material/Grid';

import type { Environment } from '@lib/Environment';
import { AdministrationCard } from './landing/AdministrationCard';
import { EventsContent } from './landing/EventsContent';
import { NoEventsContent } from './landing/NoEventsContent';
import { RegistrationContentContainer } from '@app/registration/RegistrationContentContainer';
import { RegistrationLayout } from '@app/registration/RegistrationLayout';
import { StatisticsCard } from './landing/StatisticsCard';
import { getEnvironmentContext } from '@lib/EnvironmentContext';

import { kAnyEvent, kAnyTeam } from '@lib/auth/AccessList';

/**
 * Props accepted by the <LandingPage> component.
 */
interface LandingPageProps {
    /**
     * The environment for which the landing page is being shown.
     */
    environment: Environment;
}

/**
 * The <LandingPage> component is the page that volunteers first see when they reach our site, that
 * should compel them to apply to participate if they haven't yet, and that should bring them to the
 * Volunteer Portal when they have and are participating.
 */
export async function LandingPage(props: LandingPageProps) {
    const context = await getEnvironmentContext(props.environment);

    // TODO: Contextualise <RegistrationContentContainer> to the event and the user
    // TODO: Contextualise <RegistrationContainerContent> with the active registration
    // TODO: Populate additional events in an overflow card

    // ---------------------------------------------------------------------------------------------

    const enableAdminAccess = context.access.can('event.visible', {
        event: kAnyEvent,
        team: kAnyTeam,
    });

    const enableStatistics = context.access.can('statistics.basic');

    const primaryEvents = context.events.splice(0, 2);
    const secondaryEvents = context.events;

    return (
        <>
            <RegistrationLayout environment={props.environment}>
                <RegistrationContentContainer user={context.user}>

                    { !context.events.length &&
                        <NoEventsContent environment={props.environment} /> }

                    { !!context.events.length &&
                        <EventsContent environment={props.environment} events={primaryEvents} /> }

                </RegistrationContentContainer>
                <Grid container spacing={2} sx={{ mt: 2 }}>

                    { enableAdminAccess &&
                        <Grid size={{ xs: 12, md: 4 }}>
                            <AdministrationCard />
                        </Grid> }

                    { enableStatistics &&
                        <Grid size={{ xs: 12, md: 4 }}>
                            <StatisticsCard />
                        </Grid> }

                    { /* TODO: Display a card for |secondaryEvents| */ }

                </Grid>
            </RegistrationLayout>
        </>
    );
}
