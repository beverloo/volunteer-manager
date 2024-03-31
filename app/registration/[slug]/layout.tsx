// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import type { NextLayoutParams } from '@lib/NextRouterParams';
import { RegistrationContentContainer } from '../RegistrationContentContainer';
import { RegistrationLayout } from '../RegistrationLayout';
import { contextForRegistrationPage } from './contextForRegistrationPage';

type RegistrationEventLayoutProps = React.PropsWithChildren<NextLayoutParams<'slug'>>;

/**
 * Root layout for the registration page belonging to a particular event.
 */
export default async function RegistrationEventLayout(props: RegistrationEventLayoutProps) {
    const context = await contextForRegistrationPage(props.params.slug);
    if (!context)
        notFound();

    const { environment, event, registration, user } = context;

    return (
        <RegistrationLayout environment={environment}>
            <RegistrationContentContainer event={event.toEventData(environment.environmentName)}
                                          title={event.name}
                                          redirectUrl={`/registration/${event.slug}/application`}
                                          registration={registration?.toRegistrationData()}
                                          user={user}>
                {props.children}
            </RegistrationContentContainer>
        </RegistrationLayout>
    );
}
