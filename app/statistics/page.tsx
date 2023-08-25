// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { DashboardContainer } from './DashboardContainer';
import { DashboardGraph } from './DashboardGraph';
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
                <DashboardGraph fullWidth>
                    Graph 1
                </DashboardGraph>
                <DashboardGraph>
                    Graph 2
                </DashboardGraph>
                <DashboardGraph>
                    Graph 3
                </DashboardGraph>
            </DashboardContainer>
            <DashboardContainer title={title}>
                <DashboardGraph fullWidth>
                    Graph 4
                </DashboardGraph>
            </DashboardContainer>
        </>
    )
}
