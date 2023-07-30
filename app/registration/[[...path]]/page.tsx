// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { redirect } from 'next/navigation'

import { ApplicationPage } from './ApplicationPage';
import { ApplicationStatusPage } from './ApplicationStatusPage';
import { Event } from '@lib/Event';
import { Privilege, can } from '@lib/auth/Privileges';
import { RegistrationContent } from '../RegistrationContent';
import { RegistrationContentContainer } from '../RegistrationContentContainer';
import { RegistrationLayout } from '../RegistrationLayout';

import { getContent } from '@lib/Content';
import { getEventBySlug, getEventsForUser } from '@lib/EventLoader';
import { getRequestEnvironment } from '@lib/getRequestEnvironment';
import { getUser } from '@lib/auth/getUser';

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
    const user = await getUser();

    const path = props.params.path ?? [];

    // Step 1: Attempt to load the requested event based on the |path|. When no (valid) event has
    // been included, the user should be redirected to the homepage of the latest event.
    const event: Event | undefined = path.length ? await getEventBySlug(path.shift()!)
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

    // Step 3: Defer to more specific sub-components when this is a functional request.
    let redirectUrl = `/registration/${event.slug}`;
    let requestedPage = null;

    switch (path[0]) {
        case 'application':
            redirectUrl = `/registration/${event.slug}/application`;
            requestedPage = path[0];
            break;

        // For all dynamic content pages we require the content to exist. Redirect back to the main
        // event page when it does not, or back to the Volunteer Manager when it's the main page.
        default:
            if (!content) {
                if (path.length /** leaf page */)
                    redirect(`/registration/${event.slug}`);
                else
                    redirect('/');
            }
    }

    // Step 3: Determine whether to intercept the request for one of the form pages, or to display
    // a pure-content registration page with the information made available above.
    const backUrl = path.length ? `/registration/${event.slug}` : undefined;
    const userData = user?.toUserData();

    return (
        <RegistrationLayout environment={environment}>
            <RegistrationContentContainer title={event.name}
                                          redirectUrl={redirectUrl}
                                          user={userData}>

                { (requestedPage === 'application' && !registration) &&
                    <ApplicationPage content={content}
                                     event={event.toEventData()}
                                     user={userData} /> }
                { (requestedPage === 'application' && registration) &&
                    <ApplicationStatusPage content={content}
                                           event={event.toEventData()}
                                           registration={registration}
                                           user={userData} /> }
                { (!requestedPage && content) &&
                    <RegistrationContent backUrl={backUrl}
                                         content={content}
                                         event={event.toEventData()}
                                         showRegistrationButton={!path.length}
                                         enableRegistrationButton={!registration} /> }

            </RegistrationContentContainer>
        </RegistrationLayout>
    );
}
