// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound, redirect } from 'next/navigation';

import { determineEnvironment } from '@lib/Environment';
import { getAuthenticationContext } from '@lib/auth/AuthenticationContext';
import { getEventsForUser } from '@lib/EventLoader';

/**
 * The <RegistrationPage> component does not own content, but will redirect the user to the earliest
 * event that they're able to join. This page can also be reached through "/hello".
 */
export default async function RegistrationPage() {
    const environment = await determineEnvironment();
    if (!environment)
        notFound();

    const { access, user } = await getAuthenticationContext();

    const events = await getEventsForUser(environment.environmentName, access, user);
    for (const potentialEvent of events) {
        const potentialEventEnvironmentData =
            potentialEvent.getEnvironmentData(environment.environmentName);

        if (potentialEventEnvironmentData && potentialEventEnvironmentData.enableRegistration)
            redirect(`/registration/${potentialEvent.slug}/`);
    }

    redirect('/');
}
