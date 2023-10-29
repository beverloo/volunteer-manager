// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';

import { DashboardContainer } from './DashboardContainer';
import { determineEnvironment } from '@lib/Environment';

/**
 * The overview page of the statistics sub-app displays the primary dashboard with the key figures
 * we're tracking year-over-year. The layout adds a navigation pane to event-specific metrics that
 * the volunteers can consume in addition to this.
 */
export default async function StatisticsOverviewPage() {
    const environment = await determineEnvironment();
    const title = `${environment?.environmentTitle} Statistics`;

    return (
        <>
            <DashboardContainer title={title}>
                { /* TODO: Add graphs */ }
            </DashboardContainer>
        </>
    )
}

export const metadata: Metadata = {
    title: 'Statistics | AnimeCon Volunteering Teams',
};
