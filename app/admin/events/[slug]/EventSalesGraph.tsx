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
const kGraphWidth = 500;

/**
 * Height of the graph, in pixels. Will scale responsively.
 */
const kGraphHeight = 125;

/**
 * Props accepted by the <EventSalesGraph> component.
 */
export interface EventSalesGraphProps {
    /**
     * Appearance of the horizontal axis of the graph.
     */
    xAxis: { min: number; max: number; }

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
        const element = d3.select(ref.current!)
            .append('g')
                .attr('transform', `translate(${kGraphMargins.left}, ${kGraphMargins.top})`);

        // Add a horizontal axis:
        const xScale = d3.scaleLinear()
            .domain([ props.xAxis.min, props.xAxis.max ])
            .range([ 0, kGraphWidth - kGraphMargins.left - kGraphMargins.right ]);

        element.append('g')
            .attr('transform', `translate(0, ${ kGraphHeight - kGraphMargins.bottom })`)
            .call(d3.axisBottom(xScale).ticks(kGraphTicks.horizontal));

        // Add a vertical axis:
        const yScale = d3.scaleLinear()
            .domain([ props.yAxis.max, props.yAxis.min ])
            .range([ 0, kGraphHeight - kGraphMargins.bottom ]);

        element.append('g')
            .call(d3.axisLeft(yScale).ticks(kGraphTicks.vertical));

        // TODO: Display the data
        // TODO: Compute a confidence interval
        // TODO: Enable zooming in on the data

    }, [ props.xAxis, props.yAxis ]);

    return (
        <Box>
            <svg ref={ref} viewBox={`0 0 ${kGraphWidth} ${kGraphHeight}`} />
        </Box>
    );
}
