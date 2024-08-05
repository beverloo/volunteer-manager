// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Filters } from '../Filters';
import type { LineGraphData } from '../components/LineGraph';

/**
 * Query that gathers the number of volunteers for each of the years and teams included in the
 * `filters`. The data is intended to be displayed in a line graph.
 */
export async function getNumberOfVolunteers(filters: Filters): Promise<LineGraphData> {
    // TODO: Implement this query.

    return {
        series: [{ data: [2, 5.5, 2, 8.5, 1.5, 5] }],
        xAxis: [{ data: [1, 2, 3, 5, 8, 10] }],
    };
}
