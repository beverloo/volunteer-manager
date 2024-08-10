// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { AccessControl } from '@lib/auth/AccessControl';
import type { Environment } from '@lib/Environment';
import type { Event } from '@lib/Event';
import type { Registration } from '@lib/Registration';
import type { User } from '@lib/auth/User';
import { determineEnvironment } from '@lib/Environment';
import { getAuthenticationContext } from '@lib/auth/AuthenticationContext';
import { getEventBySlug } from '@lib/EventLoader';
import { getRegistration } from '@lib/RegistrationLoader';

/**
 * The context that should be commonly available for the different registration pages.
 */
export interface RegistrationPageContext {
    /**
     * Access that the visitor has been granted on the Volunteer Manager.
     */
    access: AccessControl;

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
     * The canonical slug that should be used for this registration page context.
     */
    slug: string;

    /**
     * Slug of the team that should be used for this registration page context.
     */
    teamSlug: string;

    /**
     * The user for whom this page is being loaded, if any.
     */
    user?: User;
}

/**
 * This function will load the common context requires for one of the pages part of the registration
 * sub-app. This involves potentially running multiple database queries. The `slug` can either be
 * the year (e.g. "2025") in single-team environments, or a combination of the year and the team's
 * slug (e.g. "2025-crew") to disambiguate for multi-team contexts.
 */
export async function contextForRegistrationPage(slug: string)
    : Promise<RegistrationPageContext | undefined>
{
    const environment = await determineEnvironment();
    if (!environment)
        return undefined;  // invalid environment

    let eventSlug: string;
    let teamSlug: string;

    if (slug.includes('-')) {
        [ eventSlug, teamSlug ] = slug.split('-', /* limit= */ 2);
        if (!environment.teams.includes(teamSlug))
            return undefined;  // this |environment| does not host the requested team

    } else {
        if (!environment.teams.length)
            return undefined;  // this |environment| does not hots any teams

        eventSlug = slug;
        teamSlug = environment.teams[0];  // primary
    }

    const event = await getEventBySlug(eventSlug);
    if (!event)
        return undefined;  // invalid event

    const authenticationContext = await getAuthenticationContext();
    const { access, user } = authenticationContext;

    const registration = await getRegistration(environment.domain, event, user?.userId);
    if (!access.can('event.visible', { event: eventSlug, team: teamSlug })) {
        // Note that we deliberately skip checking whether the `user` has administration access to
        // the event, as (a) it being active and (b) them participating in it satisfies our bar.
        if (!authenticationContext.user || !authenticationContext.events.has(slug)) {
            const environmentData = event.getEnvironmentData(environment.domain);
            if (!environmentData?.enableRegistration)
                return undefined;  // no access to the event
        }
    }

    return { access, environment, event, registration, slug, teamSlug, user };
}
