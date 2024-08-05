// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import { RegistrationLayout } from '@app/registration/RegistrationLayout';
import { determineEnvironment } from '@lib/Environment';

/**
 * Root layout for the statistics interface, displaying year-on-year data on the key performance
 * indicators of the AnimeCon Volunteering Teams.
 */
export default async function StatisticsLayout(props: React.PropsWithChildren) {
    const environment = await determineEnvironment();
    if (!environment)
        notFound();

    return (
        <RegistrationLayout environment={environment}>
            {props.children}
        </RegistrationLayout>
    );
}
