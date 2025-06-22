// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { BarPlot, ChartContainerPro, ChartsTooltip, type BarSeriesType }
    from '@components/proxy/mui-x-charts-pro';

/**
 * Props accepted by the <KeyMetricGraph> component.
 */
interface KeyMetricGraphProps {
    /**
     * Series that should be displayed on the graph.
     */
    series: BarSeriesType[];

    /**
     * Labels that indicate the values represented on each slice of the bar graph.
     */
    labels: string[];
}

/**
 * The <KeyMetricGraph> component displays a horizontal bar graph visualising revenue or sales in
 * the past period. Each bar can be hovered over to provide more detailed data about a certain day
 * of sales, optionally grouped by sale category.
 */
export function KeyMetricGraph(props: KeyMetricGraphProps) {
    return (
        <ChartContainerPro height={100} series={props.series} margin={0}
                           yAxis={[ { position: 'none' } ]}
                           xAxis={[
                               {
                                   scaleType: 'band',
                                   data: props.labels,
                                   position: 'none',
                               }
                           ]}>
            <BarPlot />
            <ChartsTooltip />
        </ChartContainerPro>
    );
}
