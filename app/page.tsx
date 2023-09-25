// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import type { Event } from '@lib/Event';
import type { Registration } from '@lib/Registration';
import { RegistrationLayout } from './registration/RegistrationLayout';
import { WelcomePage } from './welcome/WelcomePage';
import { determineEnvironment } from '@lib/Environment';
import { getAuthenticationContext } from '@lib/auth/AuthenticationContext';
import { getEventsForUser } from './lib/EventLoader';
import { getRegistration } from './lib/RegistrationLoader';

/**
 * The main page of the entire Volunteer Manager. Will appeal to visitors to sign up to join one of
 * our volunteering teams, or send existing volunteers to one of various destinations.
 */
export default async function RootPage() {
    const environment = await determineEnvironment();
    if (!environment)
        notFound();

    const { user } = await getAuthenticationContext();
    const events = await getEventsForUser(environment.environmentName, user);

    // Identify the most recent team for which applications are being accepted, then fetch whether
    // the `user`, if they are signed in, has applied to that event.
    let registrationEvent: Event | undefined;
    let registration: Registration | undefined;

    if (user) {
        for (const event of events) {
            const eventEnvironmentData = event.getEnvironmentData(environment.environmentName);
            if (!eventEnvironmentData || !eventEnvironmentData.enableRegistration)
                continue;

            registrationEvent = event;
            registration = await getRegistration(environment.environmentName, event, user.userId);
            break;
        }
    }

    const eventDatas = events.map(event => event.toEventData(environment.environmentName));
    const registrationEventData = registrationEvent?.toEventData(environment.environmentName);
    const registrationData = registration?.toRegistrationData();

    return (
        <RegistrationLayout environment={environment}>
            <WelcomePage events={eventDatas}
                         user={user}
                         registrationEvent={registrationEventData}
                         registration={registrationData}
                         title={environment.environmentName}
                         description={environment.teamDescription} />
        </RegistrationLayout>
    );
}
