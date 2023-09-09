// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { EventPageProps } from '../EventPageProps';
import { ApplicationPage } from './ApplicationPage';
import { ApplicationStatusPage } from './ApplicationStatusPage';

/**
 * The <EventApplicationPage> component serves the ability for volunteers to either apply to join
 * one of our events, or for them to see the status of their current application.
 */
export async function EventApplicationPage(props: EventPageProps</* UserRequired= */ false>) {
    const { content, environment, event, registration, user } = props;

    return (
        <>
            { (!registration || !user) &&
                <ApplicationPage content={content}
                                 event={event.toEventData(environment.environmentName)}
                                 user={user?.toUserData()} />
            }
            { (registration && user) &&
                <ApplicationStatusPage event={event.toEventData(environment.environmentName)}
                                       registration={registration.toRegistrationData()}
                                       user={user!.toUserData()} />
            }
        </>
    );
}
