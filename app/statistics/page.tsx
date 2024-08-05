// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Grid from '@mui/material/Unstable_Grid2/Grid2';

import type { NextSearchParams } from '@lib/NextRouterParams';
import { StatisticsFilters } from './components/StatisticsFilters';
import { StatisticsSection } from './components/StatisticsSection';

/**
 * Detailed descriptions of the KPIs displayed on the statistics overview page. Not everyone is well
 * vested in what the graph titles may mean, so
 */
const kDescriptions = {
    gender:
        'This statistic describes the gender balance in each of the teams. Our thesis is that ' +
        'balanced teams create for a more welcoming environment, where unbalanced teams ' +
        'discourage especially new volunteers from participating.',

    retention:
        'This statistic describes the percentage of volunteers who participated in the previous ' +
        'year, and decided to participate again this year. Our thesis is that volunteers who ' +
        'are treated well and enjoy what they are doing are more likely to participate again.',

    shifts:
        'This statistic describes the average number of hours volunteers helped us out. We aim ' +
        'for about 12 hours of shifts for Crew and Hosts, and about 16 hours of shifts for ' +
        'Stewards, as they receive additional training.',

} as const;

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
                <StatisticsSection title="Number of volunteers">
                    TODO
                </StatisticsSection>
                <StatisticsSection title="Shifts per volunteer (average)" kpi
                                   description={kDescriptions.shifts}>
                    TODO
                </StatisticsSection>
                <StatisticsSection title="Volunteer Retention" kpi
                                   description={kDescriptions.retention}>
                    TODO
                </StatisticsSection>
                <StatisticsSection title="Cancelled application rate">
                    TODO
                </StatisticsSection>
                <StatisticsSection title="Age distribution">
                    TODO
                </StatisticsSection>
                <StatisticsSection title="Gender distribution" kpi
                                   description={kDescriptions.gender}>
                    TODO
                </StatisticsSection>
            </Grid>
        </>
    );
}
