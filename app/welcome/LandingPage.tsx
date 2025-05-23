// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Grid from '@mui/material/Grid';

import type { Environment } from '@lib/Environment';
import { AdministrationCard } from './AdministrationCard';
import { RegistrationContentContainer } from '@app/registration/RegistrationContentContainer';
import { RegistrationLayout } from '@app/registration/RegistrationLayout';
import { StatisticsCard } from './StatisticsCard';
import { getAuthenticationContext } from '@lib/auth/AuthenticationContext';

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
    const { environment } = props;

    const { access, user } = await getAuthenticationContext();

    // TODO: Contextualise <RegistrationContentContainer> to the event and the user
    // TODO: Contextualise <RegistrationContainerContent> with the active registration
    // TODO: Populate the <WelcomeCard> in the view
    // TODO: Populate additional events in an overflow card

    // ---------------------------------------------------------------------------------------------

    const enableAdminAccess = access.can('event.visible', {
        event: kAnyEvent,
        team: kAnyTeam,
    });

    const enableStatistics = access.can('statistics.basic');

    return (
        <>
            <RegistrationLayout environment={environment}>
                <RegistrationContentContainer user={user}>
                    { /* TODO */ }
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

                </Grid>
            </RegistrationLayout>
        </>
    );
}
