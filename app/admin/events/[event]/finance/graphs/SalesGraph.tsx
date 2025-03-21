// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { useId } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography, { type TypographyProps } from '@mui/material/Typography';

import {
    ChartsAxisHighlight, ChartsClipPath, ChartsGrid, ChartsReferenceLine, ChartsTooltip,
    ChartsXAxis, ChartsYAxis, LinePlot, ResponsiveChartContainerPro, ZoomSetup,
    type ResponsiveChartContainerProProps } from './MuiChartProxy';

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
    series: ResponsiveChartContainerProProps['series'];

    /**
     * Optional styling to apply to the graph. Will be forwarded to the container.
     */
    sx?: ResponsiveChartContainerProProps['sx'];

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
 * The <SalesGraph> component renders a graph with settings consistent to how we would like graphs
 * to work in the Volunteer Manager. Input are the series, axis contents, and optional configuration
 * to specialise the default display.
 */
export function SalesGraph(props: SalesGraphProps) {
    const clipPathId = useId();

    const height = props.height ?? 300;

    const xAxis: ResponsiveChartContainerProProps['xAxis'] = [
        {
            scaleType: 'point',
            data: props.xLabels,
            zoom: props.zoom,
        }
    ];

    const yAxis: ResponsiveChartContainerProProps['yAxis'] = [
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
            <ResponsiveChartContainerPro series={props.series} height={height} margin={{ top: 24 }}
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
                { !!props.zoom && <ZoomSetup /> }
            </ResponsiveChartContainerPro>
        </>
    );
}
