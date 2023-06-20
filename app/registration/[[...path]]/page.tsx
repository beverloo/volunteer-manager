// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound, redirect } from 'next/navigation'

import { Event } from '../../lib/Event';
import { Privilege, can } from '../../lib/auth/Privileges';
import { RegistrationContent } from '../RegistrationContent';
import { RegistrationLayout } from '../RegistrationLayout';

import { getContent } from '../../lib/Content';
import { getEventBySlug, getEventsForUser } from '../../lib/EventLoader';
import { getRequestEnvironment } from '../../lib/getRequestEnvironment';
import { useUser } from '../../lib/auth/useUser';

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
    const environment = getRequestEnvironment();
    const user = await useUser('ignore');

    const path = props.params.path ?? [];

    // Step 1: Attempt to load the requested event based on the |path|. When no (valid) event has
    // been included, the user should be redirected to the homepage of the latest event.
    const event: Event | undefined = path.length ? await getEventBySlug(path.shift())
                                                 : undefined;

    if (!event || (!event.enableContent && !can(user, Privilege.EventContentOverride))) {
        const events = await getEventsForUser(user, environment);
        for (const potentialEvent of events) {
            if (potentialEvent.enableContent)
                redirect(`/registration/${potentialEvent.slug}/`);
        }

        redirect('/');
    }

    // Step 2: The |user| has access to the |event|. Two more things we need to do: fetch all their
    // registration information, and fetch the page that they wish to see on the portal.
    const [ content, registration ] = await Promise.all([
        getContent(environment, event, path),
        undefined,  // TODO: Registration
    ]);

    if (!content)
        notFound();  // TODO: Only do this for non-content pages

    // Step 3: Determine whether to intercept the request for one of the form pages, or to display
    // a pure-content registration page with the information made available above.
    return (
        <RegistrationLayout environment={environment}>
            <RegistrationContent backUrl={path.length ? `/registration/${event.slug}` : undefined}
                                 content={content}
                                 event={event.toEventData()}
                                 registration={registration}
                                 user={user.toUserData()} />
        </RegistrationLayout>
    );
}
