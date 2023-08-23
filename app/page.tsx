// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { WelcomePage } from './welcome/WelcomePage';

import type { Event } from '@lib/Event';
import type { Registration } from '@lib/Registration';

import { RegistrationLayout } from './registration/RegistrationLayout';
import { getEventsForUser } from './lib/EventLoader';
import { getRequestEnvironment } from './lib/getRequestEnvironment';
import { getTeamInformationForEnvironment } from './lib/Content';
import { getUser } from './lib/auth/getUser';
import { kEnvironmentTitle } from './Environment';
import { getRegistration } from './lib/RegistrationLoader';

/**
 * The main page of the entire Volunteer Manager. Will appeal to visitors to sign up to join one of
 * our volunteering teams, or send existing volunteers to one of various destinations.
 */
export default async function RootPage() {
    const environment = getRequestEnvironment();
    const user = await getUser();

    const events = await getEventsForUser(environment, user);
    const team = await getTeamInformationForEnvironment(environment);

    // Identify the most recent team for which applications are being accepted, then fetch whether
    // the `user`, if they are signed in, has applied to that event.
    let registrationEvent: Event | undefined;
    let registration: Registration | undefined;

    if (user) {
        for (const event of events) {
            const eventEnvironmentData = event.getEnvironmentData(environment);
            if (!eventEnvironmentData || !eventEnvironmentData.enableRegistration)
                continue;

            registrationEvent = event;
            registration = await getRegistration(environment, event, user.userId);
            break;
        }
    }

    return (
        <RegistrationLayout environment={environment}>
            <WelcomePage events={events.map(event => event.toEventData(environment))}
                         user={user?.toUserData()}
                         registrationEvent={registrationEvent?.toEventData(environment)}
                         registration={registration?.toRegistrationData()}
                         title={kEnvironmentTitle[environment]}
                         description={team!.description} />
        </RegistrationLayout>
    );
}
