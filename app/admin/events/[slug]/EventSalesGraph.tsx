// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useEffect, useRef } from 'react';

import * as d3 from 'd3';

import Box from '@mui/material/Box';

/**
 * Margins of the graph, in pixels. Fixed regardless of scale.
 */
const kGraphMargins = {
    top: 16,
    right: 16,
    bottom: 40,
    left: 48
} as const;

/**
 * Number of ticks to display on the axis of the graph.
 */
const kGraphTicks = {
    horizontal: 8,
    vertical: 4,
} as const;

/**
 * Width of the graph, in pixels. Will scale responsively.
 */
const kGraphWidth = 550;

/**
 * Height of the graph, in pixels. Will scale responsively.
 */
const kGraphHeight = 150;

/**
 * Type describing a data point part of a data series.
 */
export type EventSalesDataEntry = [ number, number ];

/**
 * Type describing a data series to display on the graph.
 */
export type EventSalesDataSeries = {
    /**
     * Colour in which the series should be displayed.
     */
    colour: string;

    /**
     * Data that the series exists of.
     */
    data: EventSalesDataEntry[];

    /**
     * Width, in pixels, the series should be drawn in.
     */
    width?: number;
};

/**
 * Props accepted by the <EventSalesGraph> component.
 */
export interface EventSalesGraphProps {
    /**
     * Series that should be displayed on the graph. Each serie should be an array of entries.
     */
    series: EventSalesDataSeries[];

    /**
     * Appearance of the horizontal axis of the graph.
     */
    xAxis: { abs?: boolean; min: number; max: number; }

    /**
     * Appearance of the vertical axis of the graph.
     */
    yAxis: { min: number; max: number; }
}

/**
 * The <EventSalesGraph> component displays a D3.js-based graph flagging the sales for our event
 * thus far, compared to sales from the previous few events.
 */
export function EventSalesGraph(props: EventSalesGraphProps) {
    const ref = useRef<SVGSVGElement | null>(null);
    useEffect(() => {
        const root = d3.select(ref.current!);

        // Remove all children that are currently part of the |root|, as we will be recreating all
        // of them. This is likely required because of Next.js' SSR implementation.
        root.selectChildren().remove();

        // -----------------------------------------------------------------------------------------

        const graphAreaWidth = kGraphWidth - kGraphMargins.left - kGraphMargins.right;
        const graphAreaHeight = kGraphHeight - kGraphMargins.bottom;

        // Utility functions:
        const formattedBottomAxis = (scale: d3.ScaleLinear<number, number, number>) =>
            d3.axisBottom(scale)
                .ticks(kGraphTicks.horizontal)
                .tickFormat(value => `${ !!props.xAxis.abs ? Math.abs(+value) : +value }`);

        const formattedLeftAxis = (scale: d3.ScaleLinear<number, number, number>) =>
            d3.axisLeft(scale).ticks(kGraphTicks.vertical);

        // -----------------------------------------------------------------------------------------

        // Select the root element and translate it:
        const element = root
            .append('g')
                .attr('transform', `translate(${kGraphMargins.left}, ${kGraphMargins.top})`);

        // Add a horizontal axis:
        const scaleX = d3.scaleLinear()
            .domain([ props.xAxis.min, props.xAxis.max ])
            .range([ 0, graphAreaWidth ]);

        const axisX = element.append('g')
            .attr('transform', `translate(0, ${ graphAreaHeight })`)
            .call(formattedBottomAxis(scaleX));

        // Add a vertical axis:
        const scaleY = d3.scaleLinear()
            .domain([ props.yAxis.max, props.yAxis.min ])
            .range([ 0, graphAreaHeight ])
            .nice();

        const axisY = element.append('g')
            .call(formattedLeftAxis(scaleY));

        // Create a clip path:
        const clip = element.append('defs')
            .append('SVG:clipPath')
            .attr('id', 'clip')
            .append('SVG:rect')
                .attr('width', graphAreaWidth)
                .attr('height', graphAreaHeight)
                .attr('x', 1)
                .attr('y', 0);

        const clippedContainer = element.append('g')
            .attr('clip-path', 'url(#clip)');

        // -----------------------------------------------------------------------------------------
        // Data
        // -----------------------------------------------------------------------------------------

        // Display each of the series:
        for (const serie of props.series) {
            clippedContainer.append('path')
                .classed('data-entry', true)
                .datum(serie.data)
                .attr('fill', 'none')
                .attr('stroke', serie.colour)
                .attr('stroke-width', serie.width || 1.5)
                .attr('style', 'vector-effect: non-scaling-stroke')
                .attr('d', d3.line()
                    .x(entry => scaleX(entry[0]))
                    .y(entry => scaleY(entry[1]))
                    .curve(d3.curveCardinal.tension(0.25)));
        }

        // -----------------------------------------------------------------------------------------
        // Interactivity
        // -----------------------------------------------------------------------------------------

        function adjustChartForZoom(event: d3.D3ZoomEvent<SVGRectElement, unknown>) {
            const updatedScaleX = event.transform.rescaleX(scaleX);
            const updatedScaleY = event.transform.rescaleY(scaleY);

            axisX.call(formattedBottomAxis(updatedScaleX));
            axisY.call(formattedLeftAxis(updatedScaleY));

            clippedContainer.selectAll('path')
                .attr('transform', event.transform as any);
        }

        const zoom = d3.zoom()
            .scaleExtent([ 1, 12 ])
            .extent([ [ 0, 0 ], [ kGraphWidth, kGraphHeight ] ])
            .on('zoom', adjustChartForZoom);

        element.append('rect')
            .attr('width', graphAreaWidth)
            .attr('height', graphAreaHeight)
            .style('fill', 'none')
            .style('pointer-events', 'all')
            .call(zoom as any);

        // TODO: Compute a confidence interval
        // TODO: Enable a hover indicator

    }, [ props.series, props.xAxis, props.yAxis ]);

    return (
        <Box>
            <svg ref={ref} viewBox={`0 0 ${kGraphWidth} ${kGraphHeight}`} />
        </Box>
    );
}
