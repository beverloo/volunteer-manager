// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import type { NextRouterParams } from '@lib/NextRouterParams';
import { type Content, getContent, getStaticContent } from '@lib/Content';
import { ApplicationPage } from './ApplicationPage';
import { ApplicationStatusPage } from './ApplicationStatusPage';
import { Markdown } from '@components/Markdown';
import { Privilege, can } from '@lib/auth/Privileges';
import { contextForRegistrationPage } from '../contextForRegistrationPage';
import { generatePortalMetadataFn } from '../../generatePortalMetadataFn';

/**
 * The <EventApplicationPage> component serves the ability for volunteers to either apply to join
 * one of our events, or for them to see the status of their current application.
 */
export default async function EventApplicationPage(props: NextRouterParams<'slug'>) {
    const context = await contextForRegistrationPage(props.params.slug);
    if (!context)
        notFound();

    const { environment, event, registration, user } = context;

    let content: Content | undefined = undefined;
    let state: 'status' | 'application' | 'unavailable';

    if (registration && user) {
        state = 'status';
    } else {
        const environmentData = event.getEnvironmentData(environment.environmentName);
        if (environmentData?.enableRegistration || can(user, Privilege.EventRegistrationOverride)) {
            content = await getContent(environment.environmentName, event, [ 'application' ]);
            state = 'application';
        } else {
            content = await getStaticContent([ 'registration', 'application', 'unavailable' ]);
            state = 'unavailable';
        }
    }

    return (
        <>
            { state === 'application' &&
                <ApplicationPage content={content} user={user}
                                 event={event.toEventData(environment.environmentName)} /> }
            { (state === 'status' && (registration && user)) &&
                <ApplicationStatusPage event={event.toEventData(environment.environmentName)}
                                       registration={registration.toRegistrationData()}
                                       user={user} /> }
            { state === 'unavailable' &&
                <Markdown sx={{ p: 2 }}>{content?.markdown}</Markdown> }
        </>
    );
}

export const generateMetadata = generatePortalMetadataFn('Application');
