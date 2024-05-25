// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import type { SxProps } from '@mui/system';
import type { Theme } from '@mui/material/styles';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Unstable_Grid2';
import { deepmerge } from '@mui/utils';

import type { Event } from '@lib/Event';
import type { Registration } from '@lib/Registration';
import { AdditionalEventCard } from './welcome/AdditionalEventCard';
import { AdministrationCard } from './welcome/AdministrationCard';
import { Privilege, can } from '@lib/auth/Privileges';
import { RegistrationLayout } from './registration/RegistrationLayout';
import { StatisticsCard } from './welcome/StatisticsCard';
import { WelcomePage } from './welcome/WelcomePage';
import { determineEnvironment } from '@lib/Environment';
import { generatePortalMetadataFn } from './registration/generatePortalMetadataFn';
import { getAuthenticationContext } from '@lib/auth/AuthenticationContext';
import { getEventsForUser } from './lib/EventLoader';
import { getRegistration } from './lib/RegistrationLoader';

/**
 * Styles that apply to the photo card, displaying the environment's impression image.
 */
const kPhotoCardStyles: SxProps<Theme> = {
    height: '145px',

    backgroundPosition: 'top left',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    alignSelf: 'stretch',
};

/**
 * The main page of the entire Volunteer Manager. Will appeal to visitors to sign up to join one of
 * our volunteering teams, or send existing volunteers to one of various destinations.
 */
export default async function RootPage() {
    const environment = await determineEnvironment();
    if (!environment)
        notFound();

    const authenticationContext = await getAuthenticationContext();
    const { user } = authenticationContext;

    const events = await getEventsForUser(environment.environmentName, user);

    // TODO: What to do when |events.length| === 0?

    // ---------------------------------------------------------------------------------------------

    // Users can be granted overrides for being able to access the registration and schedule apps
    // events that haven't formally published them yet. Incorporate this in the decisions.
    const registrationOverride = can(user, Privilege.EventContentOverride);
    const scheduleOverride = can(user, Privilege.EventScheduleOverride);

    // Determine whether the user has access to the administration area. This is the case when they
    // either are an event adminstrator, or have senior-level access to any active event.
    const administratorAccess: Set<string> = new Set;
    if (!!authenticationContext.user) {
        if (can(user, Privilege.EventAdministrator)) {
            for (const event of events)
                administratorAccess.add(event.slug);

        } else {
            for (const { event, admin } of authenticationContext.events.values()) {
                if (!!admin)
                    administratorAccess.add(event);
            }
        }
    }

    const primaryEvent = events.shift();
    const secondaryEvent = events.shift();


    // ---------------------------------------------------------------------------------------------
    // TODO: Refactor

    // Identify the most recent team for which applications are being accepted, then fetch whether
    // the `user`, if they are signed in, has applied to that event.
    let registrationEvent: Event | undefined;
    let registration: Registration | undefined;

    const adminAccess: string[] = [];

    if (user) {
        for (const event of events) {
            const eventEnvironmentData = event.getEnvironmentData(environment.environmentName);
            if (!eventEnvironmentData || !eventEnvironmentData.enableRegistration)
                continue;

            registrationEvent = event;
            registration = await getRegistration(environment.environmentName, event, user.userId);
            break;
        }

        for (const { admin, event } of authenticationContext.events.values()) {
            if (!!admin)
                adminAccess.push(event);
        }
    }

    const eventDatas = events.map(event => event.toEventData(environment.environmentName));
    const registrationEventData = registrationEvent?.toEventData(environment.environmentName);
    const registrationData = registration?.toRegistrationData();

    // ---------------------------------------------------------------------------------------------

    const landingStyle: SxProps<Theme> = {
        backgroundImage: `url('/images/${environment.environmentName}/landing.jpg')`
    };

    return (
        <RegistrationLayout environment={environment}>
            <WelcomePage adminAccess={adminAccess}
                         environment={environment.environmentName}
                         events={eventDatas}
                         user={user}
                         registrationEvent={registrationEventData}
                         registration={registrationData}
                         title={environment.environmentTitle}
                         description={environment.teamDescription} />

            <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid xs={12} md={0} sx={{ display: { xs: 'block', md: 'none' } }}>
                    <Card elevation={2} sx={ deepmerge(kPhotoCardStyles, landingStyle) } />
                </Grid>

                { !!administratorAccess.size &&
                    <Grid xs={12} md={4}>
                        <AdministrationCard />
                    </Grid> }

                { can(user, Privilege.Statistics) &&
                    <Grid xs={12} md={4}>
                        <StatisticsCard title={environment.environmentTitle} />
                    </Grid> }

                { events.map(event => {
                    const admin = administratorAccess.has(event.slug);
                    const data = event.getEnvironmentData(environment.environmentName);

                    const enableRegistration = data?.enableContent || admin || registrationOverride;
                    const enableSchedule = data?.enableSchedule || admin || scheduleOverride;

                    return (
                        <Grid key={event.slug} xs={12} md={4}>
                            <AdditionalEventCard name={event.name} slug={event.slug}
                                                 enableRegistration={enableRegistration}
                                                 enableSchedule={enableSchedule} />
                        </Grid>
                    );
                } )}

            </Grid>
        </RegistrationLayout>
    );
}

export const generateMetadata = generatePortalMetadataFn();
