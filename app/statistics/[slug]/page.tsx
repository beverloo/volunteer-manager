// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import { Suspense } from 'react';

import type { NextRouterParams } from '@lib/NextRouterParams';
import { DashboardContainer } from '../DashboardContainer';
import { DashboardGraphFallback, DashboardGraph } from '../DashboardGraph';
import { EventAgeDistributionGraph } from '../graphs/EventAgeDistributionGraph';
import { EventGenderDistributionGraph } from '../graphs/EventGenderDistributionGraph';
import { Privilege } from '@lib/auth/Privileges';
import { determineEnvironment } from '@lib/Environment';
import { getEventBySlug } from '@lib/EventLoader';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';


/**
 * Statistics specific to a particular event. The `slug` will be validated as one of the unique
 * event slugs we have stored in the database.
 */
export default async function StatisticsEventPage(props: NextRouterParams<'slug'>) {
    const authenticationContext = await requireAuthenticationContext({
        privilege: Privilege.Statistics,
    });

    const eventSlug = props.params.slug;

    const environment = await determineEnvironment();
    const event = await getEventBySlug(eventSlug);

    // Check (1): Require a valid environment and a valid event.
    if (!environment || !event)
        notFound();

    // Check (2): Require the environment (team) to be participating in the event.
    const eventEnvironmentData = event.getEnvironmentData(environment.environmentName);
    if (!eventEnvironmentData)
        notFound();

    // Check (3): Require the signed in user to have access to the event data.
    if (!authenticationContext.events.has(eventSlug)) {
        if (!eventEnvironmentData.enableContent)
            notFound();
    }

    // Demographics
    //
    //   TODO: Role distribution
    //   TODO: T-shirt size distribution
    //
    // Participation
    //
    //   TODO: Contribution (hours/shifts)
    //   TODO: Facility usage (hotel/training)
    //   TODO: Preferences (hours/timing)
    //   TODO: Retention
    //

    return (
        <>
            <DashboardContainer title={`Demographics (${event.shortName})`}>
                <Suspense fallback={ <DashboardGraphFallback title="Age distribution" /> }>
                    <EventAgeDistributionGraph eventId={event.eventId} teamId={environment.id} />
                </Suspense>
                <Suspense fallback={ <DashboardGraphFallback title="Gender distribution" /> }>
                    <EventGenderDistributionGraph eventId={event.eventId} teamId={environment.id} />
                </Suspense>
            </DashboardContainer>
            <DashboardContainer title={`Participation (${event.shortName})`}>
                { /* TODO: No graphs yet */ }
            </DashboardContainer>
        </>
    )
}
