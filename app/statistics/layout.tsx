// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import Paper from '@mui/material/Paper';

import { Navigation, type NavigationProps } from './components/Navigation';
import { RegistrationLayout } from '@app/registration/RegistrationLayout';
import { determineEnvironment } from '@lib/Environment';
import { determineFilters } from './Filters';

/**
 * Root layout for the statistics interface, displaying year-on-year data on the key performance
 * indicators of the AnimeCon Volunteering Teams.
 */
export default async function StatisticsLayout(props: React.PropsWithChildren) {
    const environment = await determineEnvironment();
    if (!environment)
        notFound();

    const filters = await determineFilters();

    let enableSales: NavigationProps['enableSales'] = [ /* none */ ];
    if (!!filters.access.finances) {
        enableSales = filters.events.filter(event => !!event.hasSales).map(event => ({
            name: event.name,
            slug: event.slug,
        }));
    }

    return (
        <RegistrationLayout environment={environment}>
            <Paper sx={{ mb: 2, p: 1 }}>
                <Navigation enableSales={enableSales} />
            </Paper>
            {props.children}
        </RegistrationLayout>
    );
}
