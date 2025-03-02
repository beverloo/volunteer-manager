// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { useId } from 'react';

import { ResponsiveChartContainer, type ResponsiveChartContainerProps } from '@mui/x-charts/ResponsiveChartContainer';
import { ChartsAxisHighlight } from '@mui/x-charts/ChartsAxisHighlight';
import { ChartsClipPath } from '@mui/x-charts/ChartsClipPath';
import { ChartsGrid } from '@mui/x-charts/ChartsGrid';
import { ChartsReferenceLine } from '@mui/x-charts/ChartsReferenceLine';
import { ChartsTooltip } from '@mui/x-charts/ChartsTooltip/ChartsTooltip';
import { ChartsXAxis } from '@mui/x-charts/ChartsXAxis';
import { ChartsYAxis } from '@mui/x-charts/ChartsYAxis';
import { LinePlot } from '@mui/x-charts/LineChart';
import Typography, { type TypographyProps } from '@mui/material/Typography';

/**
 * Colour in which the line visualising maximum ticket sales should be displayed.
 */
const kMaximumColor = '#C62828';

/**
 * Colour in which the line visualising today's date should be displayed.
 */
const kTodayColor = '#1976D2';

/**
 * Props accepted by the <SalesGraph> component.
 */
export interface SalesGraphProps {
    /**
     * Optional limit indicating the maximum number of tickets that can be sold.
     */
    limit?: number;

    /**
     * Series that should be displayed on the graph.
     */
    series: ResponsiveChartContainerProps['series'];

    /**
     * Title that should be displayed on the graph, if any.
     */
    title?: string;

    /**
     * Variant of the <Typography> component that should be used for the title. Defaults to "h5".
     */
    titleVariant?: TypographyProps['variant'];

    /**
     * Date on which the "today" vertical line should be displayed.
     */
    today?: string;

    /**
     * Labels that should be displayed on the x-axis of the graph.
     */
    xLabels: string[];
}

/**
 * The <SalesGraph> component renders a graph with settings consistent to how we would like graphs
 * to work in the Volunteer Manager. Input are the series, axis contents, and optional configuration
 * to specialise the default display.
 */
export function SalesGraph(props: SalesGraphProps) {
    const clipPathId = useId();

    const yAxis = props.limit ? [{ max: Math.floor(props.limit * 1.1) }] : undefined;

    return (
        <>
            { !!props.title &&
                <Typography variant={ props.titleVariant ?? 'h5' }>
                    {props.title}
                </Typography> }
            <ResponsiveChartContainer series={props.series} height={300} margin={{ top: 24 }}
                                      xAxis={[ { scaleType: 'point', data: props.xLabels } ]}
                                      yAxis={yAxis}>
                <g clipPath={clipPathId}>
                    <LinePlot />
                    { !!props.today &&
                        <ChartsReferenceLine x={props.today}
                                             lineStyle={{
                                                 stroke: kTodayColor
                                             }} /> }
                    { !!props.limit &&
                        <ChartsReferenceLine y={props.limit}
                                             label={`${props.limit}`}
                                             labelStyle={{
                                                 fill: kMaximumColor,
                                                 fontSize: '12px',
                                             }}
                                             lineStyle={{
                                                 strokeDasharray: 4,
                                                 stroke: kMaximumColor
                                             }} /> }
                </g>
                <ChartsAxisHighlight x="line" />
                <ChartsGrid horizontal={true} />
                <ChartsTooltip />
                <ChartsXAxis />
                <ChartsYAxis />
                <ChartsClipPath id={clipPathId} />
            </ResponsiveChartContainer>
        </>
    );
}
