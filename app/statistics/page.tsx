// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Grid from '@mui/material/Unstable_Grid2/Grid2';

import type { NextSearchParams } from '@lib/NextRouterParams';
import { StatisticsFilters } from './components/StatisticsFilters';
import { StatisticsSection } from './components/StatisticsSection';

/**
 * Root page of the statistics interface. While statistics are styled individually for each of the
 * environments, contents are the same across them. People with access to the statistics are able
 * to drill in to each one of them, across events and teams.
 */
export default async function StatisticsPage(params: NextSearchParams) {
    const searchParams = new URLSearchParams(params.searchParams);

    return (
        <>
            <StatisticsFilters searchParams={searchParams} />
            <Grid container spacing={2}>
                <StatisticsSection title="First graph"
                                   searchParams={searchParams} url="/statistics/volunteers">
                    TODO
                </StatisticsSection>
                <StatisticsSection title="Second graph">
                    TODO
                </StatisticsSection>
            </Grid>
        </>
    );
}
