// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { useId } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography, { type TypographyProps } from '@mui/material/Typography';

import {
    ChartContainerPro, type ChartContainerProProps, ChartsAxisHighlight,
    ChartsClipPath, ChartsGrid, ChartsReferenceLine, ChartsTooltip, ChartsXAxis, ChartsYAxis,
    LinePlot, type LineSeriesType } from './MuiChartProxy';

/**
 * Colour in which the line visualising maximum ticket sales should be displayed.
 */
const kMaximumColor = '#C62828';

/**
 * Colour in which the line visualising today's date should be displayed.
 */
const kTodayColor = '#1976D2';

/**
 * Props accepted by the <SalesLineGraph> component.
 */
export interface SalesLineGraphProps {
    /**
     * Action to display at the right-hand side of the title.
     */
    action?: React.ReactNode;

    /**
     * Maximum height of the graph, in pixels. Defaults to 300px.
     */
    height?: number;

    /**
     * Optional limit indicating the maximum number of tickets that can be sold.
     */
    limit?: number;

    /**
     * Series that should be displayed on the graph.
     */
    series: LineSeriesType[];

    /**
     * Optional styling to apply to the graph. Will be forwarded to the container.
     */
    sx?: ChartContainerProProps['sx'];

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

    /**
     * Whether to enable zooming on the graph.
     */
    zoom?: boolean;
}

/**
 * The <SalesLineGraph> component renders a graph with settings consistent to how we would like
 * graphs to work in the Volunteer Manager. Input are the series, axis contents, and optional
 * configuration to specialise the default display.
 */
export function SalesLineGraph(props: SalesLineGraphProps) {
    const clipPathId = useId();

    const height = props.height ?? 300;

    const xAxis: ChartContainerProProps['xAxis'] = [
        {
            scaleType: 'point',
            data: props.xLabels,
            zoom: props.zoom,
        }
    ];

    const yAxis: ChartContainerProProps['yAxis'] = [
        {
            max: props.limit ? Math.floor(props.limit * 1.1) : undefined,
            zoom: props.zoom,
        },
    ];

    return (
        <>
            { (!!props.action || !!props.title) &&
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    { !!props.title &&
                        <Typography noWrap variant={ props.titleVariant ?? 'h5' }>
                            {props.title}
                        </Typography> }
                    { !!props.action &&
                        <Box justifySelf="flex-end">
                            {props.action}
                        </Box> }
                </Stack> }
            <ChartContainerPro series={props.series} height={height} margin={{ left: 8, top: 24 }}
                               xAxis={xAxis} yAxis={yAxis} sx={props.sx}>
                <ChartsClipPath id={clipPathId} />
                <g clipPath={`url(#${clipPathId})`}>
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
            </ChartContainerPro>
        </>
    );
}
