// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import type { NextRouterParams } from '@lib/NextRouterParams';
import { ApplicationPage } from './ApplicationPage';
import { ApplicationStatusPage } from './ApplicationStatusPage';
import { contextForRegistrationPage } from '../contextForRegistrationPage';
import { getContent } from '@lib/Content';

/**
 * The <EventApplicationPage> component serves the ability for volunteers to either apply to join
 * one of our events, or for them to see the status of their current application.
 */
export default async function EventApplicationPage(props: NextRouterParams<'slug'>) {
    const context = await contextForRegistrationPage(props.params.slug);
    if (!context)
        notFound();

    const { environment, event, registration, user } = context;

    const content = await getContent(environment.environmentName, event, [ 'application' ]);

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
