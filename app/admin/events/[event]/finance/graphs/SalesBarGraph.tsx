// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { useId } from 'react';

import {
    type AllSeriesType, BarPlot, ChartContainerPro, type ChartContainerProProps,
    ChartsAxisHighlight, ChartsClipPath, ChartsGrid, ChartsTooltip, ChartsXAxis, ChartsYAxis }
    from './MuiChartProxy';

/**
 * Props accepted by the <SalesBarGraph> component.
 */
export interface SalesBarGraphProps {
    /**
     * Maximum height of the graph, in pixels. Defaults to 300px.
     */
    height?: number;

    /**
     * Series that should be displayed on the graph.
     */
    series: AllSeriesType[];

    /**
     * Optional styling to apply to the graph. Will be forwarded to the container.
     */
    sx?: ChartContainerProProps['sx'];

    /**
     * Labels that should be displayed on the x-axis of the graph.
     */
    xLabels: string[];
}

/**
 * The <SalesBarGraph> component renders a bar graph, optionally with multiple series.
 */
export function SalesBarGraph(props: SalesBarGraphProps) {
    const clipPathId = useId();

    const height = props.height ?? 300;

    const xAxis: ChartContainerProProps['xAxis'] = [
        {
            scaleType: 'band',
            data: props.xLabels,
        }
    ];

    const yAxis: ChartContainerProProps['yAxis'] = [{ zoom: false }];

    return (
        <ChartContainerPro series={props.series} height={height} margin={{ left: 0, top: 24 }}
                           xAxis={xAxis} yAxis={yAxis} sx={props.sx}>
            <ChartsClipPath id={clipPathId} />
            <g clipPath={`url(#${clipPathId})`}>
                <BarPlot />
            </g>
            <ChartsAxisHighlight x="line" />
            <ChartsGrid horizontal={true} />
            <ChartsTooltip />
            <ChartsXAxis />
            <ChartsYAxis />
        </ChartContainerPro>
    );
}
