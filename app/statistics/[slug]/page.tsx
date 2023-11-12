// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import { Suspense } from 'react';

import type { NextRouterParams } from '@lib/NextRouterParams';
import { DashboardContainer } from '../DashboardContainer';
import { DashboardGraphFallback } from '../DashboardGraph';
import { EventAgeDistributionGraph } from '../graphs/EventAgeDistributionGraph';
import { EventAvailabilityTimeSeriesGraph } from '../graphs/EventAvailabilityTimeSeriesGraph';
import { EventGenderDistributionGraph } from '../graphs/EventGenderDistributionGraph';
import { EventHotelParticipationGraph } from '../graphs/EventHotelParticipationGraph';
import { EventInboundRetentionGraph } from '../graphs/EventInboundRetentionGraph';
import { EventRoleDistributionGraph } from '../graphs/EventRoleDistributionGraph';
import { EventRollingRetentionGraph } from '../graphs/EventRollingRetentionGraph';
import { EventStatusRetentionGraph } from '../graphs/EventStatusRentionGraph';
import { EventTrainingParticipationGraph } from '../graphs/EventTrainingParticipationGraph';
import { Privilege, can } from '@lib/auth/Privileges';
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
        const eventAdministrator = can(authenticationContext.user, Privilege.EventAdministrator);
        if (!eventAdministrator && !eventEnvironmentData.enableContent)
            notFound();
    }

    // Participation
    //
    //   TODO: Contribution (hours/shifts)
    //   TODO: Preferences (hours/timing)
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
                <Suspense fallback={ <DashboardGraphFallback title="Role distribution" /> }>
                    <EventRoleDistributionGraph eventId={event.eventId} teamId={environment.id} />
                </Suspense>
            </DashboardContainer>
            <DashboardContainer title={`Retention (${event.shortName})`}>
                <Suspense fallback={ <DashboardGraphFallback title="Y/Y retention" /> }>
                    <EventRollingRetentionGraph eventId={event.eventId} teamId={environment.id}
                                                eventStartTime={event.startTime} />
                </Suspense>
                <Suspense fallback={ <DashboardGraphFallback title="Inbound retention" /> }>
                    <EventInboundRetentionGraph eventId={event.eventId} teamId={environment.id}
                                                eventStartTime={event.startTime} />
                </Suspense>
                <Suspense fallback={ <DashboardGraphFallback title="Inbound applications" /> }>
                    <EventStatusRetentionGraph eventId={event.eventId} teamId={environment.id} />
                </Suspense>
            </DashboardContainer>
            <DashboardContainer title={`Participation (${event.shortName})`}>
                <Suspense fallback={ <DashboardGraphFallback title="Hotel room bookings" /> }>
                    <EventHotelParticipationGraph eventId={event.eventId} teamId={environment.id} />
                </Suspense>
                <Suspense fallback={ <DashboardGraphFallback title="Training participation" /> }>
                    <EventTrainingParticipationGraph eventId={event.eventId}
                                                     teamId={environment.id} />
                </Suspense>
                <Suspense fallback={ <DashboardGraphFallback fullWidth
                                                             title="Volunteer availability" /> }>
                    <EventAvailabilityTimeSeriesGraph eventId={event.eventId}
                                                      teamId={environment.id} />
                </Suspense>
            </DashboardContainer>
        </>
    )
}
