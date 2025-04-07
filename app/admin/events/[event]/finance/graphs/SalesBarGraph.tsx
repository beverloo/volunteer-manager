// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { useId } from 'react';

import {
    BarPlot, ChartsAxisHighlight, ChartsClipPath, ChartsGrid, ChartsTooltip, ChartsXAxis,
    ChartsYAxis, ResponsiveChartContainerPro, type ResponsiveChartContainerProProps }
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
    series: ResponsiveChartContainerProProps['series'];

    /**
     * Optional styling to apply to the graph. Will be forwarded to the container.
     */
    sx?: ResponsiveChartContainerProProps['sx'];

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

    const xAxis: ResponsiveChartContainerProProps['xAxis'] = [
        {
            scaleType: 'band',
            data: props.xLabels,
        }
    ];

    const yAxis: ResponsiveChartContainerProProps['yAxis'] = [{ zoom: false }];

    return (
        <ResponsiveChartContainerPro series={props.series} height={height} margin={{ top: 24 }}
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
        </ResponsiveChartContainerPro>
    );
}
