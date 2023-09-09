// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound, redirect } from 'next/navigation';

import type { EventPageProps, EventPageFn } from './EventPageProps';
import type { Event } from '@lib/Event';
import { EventApplicationHotelsPage } from './application/hotel/EventApplicationHotelsPage';
import { EventApplicationPage } from './application/EventApplicationPage';
import { Privilege, can } from '@lib/auth/Privileges';
import { RegistrationContent } from '../RegistrationContent';
import { RegistrationContentContainer } from '../RegistrationContentContainer';
import { RegistrationLayout } from '../RegistrationLayout';
import { determineEnvironment } from '@lib/Environment';
import { getContent } from '@lib/Content';
import { getEventBySlug, getEventsForUser } from '@lib/EventLoader';
import { getRegistration } from '@app/lib/RegistrationLoader';
import { getUser } from '@lib/auth/getUser';

/**
 * The <EventPage> component displays the regular content on one of the registration sub-pages.
 */
async function EventPage(props: EventPageProps</* UserRequired= */ false>) {
    const { content, event, path } = props;

    if (!content)
        notFound();

    const backUrl = path.length ? `/registration/${event.slug}` : undefined;
    return (
        <RegistrationContent backUrl={backUrl}
                             content={content}
                             event={event.toEventData()}
                             showRegistrationButton={!path.length}
                             enableRegistrationButton={!props.registration} />
    );
}

/**
 * Properties accepted by the <EventRegistrationPage> server component.
 */
interface EventRegistrationPageProps {
    /**
     * Parameters passed to the <EventRegistrationPage> component by the NextJS router.
     */
    params: {
        /**
         * The requested path, relative from the /registration/ root path. This encapsulates both
         * informational pages and the active pages that keep track of a volunteer's registration.
         */
        path?: string[];
    };
}

/**
 * Root component for the registration sub-app in the volunteer manager. There are two possible
 * displays here: informational pages fetched from the database, or interactive pages that maintain
 * a known volunteer's registration information, answer and details. The exact information that is
 * made available will depend on the environment the volunteer is participating in.
 */
export default async function EventRegistrationPage(props: EventRegistrationPageProps) {
    const environment = await determineEnvironment();
    if (!environment)
        notFound();

    const user = await getUser();

    // Step 1: Attempt to load the requested event based on the |path|. When no (valid) event has
    // been included, the user should be redirected to the homepage of the latest event.
    const path = props.params.path ?? [];
    const event: Event | undefined = path.length ? await getEventBySlug(path.shift()!)
                                                 : undefined;

    const environmentData = event?.getEnvironmentData(environment.environmentName);

    if (!event || !environmentData ||
        (!environmentData.enableContent && !can(user, Privilege.EventContentOverride)))
    {
        const events = await getEventsForUser(environment.environmentName, user);
        for (const potentialEvent of events) {
            const potentialEventEnvironmentData =
                potentialEvent.getEnvironmentData(environment.environmentName);

            if (potentialEventEnvironmentData && potentialEventEnvironmentData.enableContent)
                redirect(`/registration/${potentialEvent.slug}/`);
        }

        redirect('/');
    }

    // Step 2: The |user| has access to the |event|. Two more things we need to do: fetch all their
    // registration information, and fetch the page that they wish to see on the portal.
    const content = await getContent(environment.environmentName, event, path);
    const registration = await getRegistration(environment.environmentName, event, user?.userId);

    // Step 3: Defer to more specific sub-components that is able to handle this request.
    let component: EventPageFn = EventPage;
    let redirectUrl = `/registration/${event.slug}`;

    switch (path.join('/')) {
        case 'application':
            component = EventApplicationPage;
            redirectUrl = `/registration/${event.slug}/application`;
            break;
        case 'application/hotel':
            if (user && registration)
                component = EventApplicationHotelsPage;
            break;
    }

    const componentContent = await component({
        content, environment, event, path,
        registration: registration!,
        user: user!,
    });

    return (
        <RegistrationLayout environment={environment}>
            <RegistrationContentContainer event={event.toEventData(environment.environmentName)}
                                          title={event.name}
                                          redirectUrl={redirectUrl}
                                          registration={registration?.toRegistrationData()}
                                          user={user?.toUserData()}>
                {componentContent}
            </RegistrationContentContainer>
        </RegistrationLayout>
    );
}
