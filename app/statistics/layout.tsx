// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import { DashboardNavigation  } from './DashboardNavigation';
import { RegistrationLayout } from '../registration/RegistrationLayout';
import { determineEnvironment } from '@lib/Environment';

import Stack from '@mui/material/Stack';

/**
 * Props accepted by the <StatisticsLayout> component. Will be populated by NextJS.
 */
interface StatisticsLayoutProps {
    children: React.ReactElement;
}

/**
 * This function provides the common layout for the statistics sub-app, which is the Environment-
 * specific wrapper and a header pointing to the different statistics the user has access to.
 */
export default async function StatisticsLayout(props: StatisticsLayoutProps) {
    const environment = await determineEnvironment();
    if (!environment)
        notFound();

    return (
        <RegistrationLayout environment={environment}>
            <Stack direction="column" spacing={2}>
                <DashboardNavigation />
                {props.children}
            </Stack>
        </RegistrationLayout>
    );
}
