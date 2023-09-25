// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Environment } from '@lib/Environment';
import type { Event } from '@lib/Event';
import type { Registration } from '@lib/Registration';
import type { User } from '@lib/auth/User';

import { Privilege, can } from '@lib/auth/Privileges';
import { determineEnvironment } from '@lib/Environment';
import { getAuthenticationContext } from '@lib/auth/AuthenticationContext';
import { getEventBySlug } from '@lib/EventLoader';
import { getRegistration } from '@lib/RegistrationLoader';

/**
 * The context that should be commonly available for the different registration pages.
 */
export interface RegistrationPageContext {
    /**
     * The environment for which the page is being loaded.
     */
    environment: Environment;

    /**
     * The event for which this page is being shown.
     */
    event: Event;

    /**
     * The registration owned by the signed in `user`, if any.
     */
    registration?: Registration;

    /**
     * The user for whom this page is being loaded, if any.
     */
    user?: User;
}

/**
 * This function will load the common context requires for one of the pages part of the registration
 * sub-app. This involves potentially running multiple database queries.
 */
export async function contextForRegistrationPage(slug: string)
    : Promise<RegistrationPageContext | undefined>
{
    const environment = await determineEnvironment();
    if (!environment)
        return undefined;  // invalid environment

    const event = await getEventBySlug(slug);
    if (!event)
        return undefined;  // invalid event

    const { user } = await getAuthenticationContext();
    const registration = await getRegistration(environment.environmentName, event, user?.userId);

    if (!can(user, Privilege.EventContentOverride)) {
        const environmentData = event.getEnvironmentData(environment.environmentName);
        if (!environmentData?.enableContent)
            return undefined;  // no access to the event
    }

    return { environment, event, registration, user };
}
