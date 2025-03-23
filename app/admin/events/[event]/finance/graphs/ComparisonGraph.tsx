// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { SalesGraph, type SalesGraphProps } from './SalesGraph';

/**
 * Which colours should the edition series be rendered in? More recent series (first entries) should
 * be more pronounced on the graph than later series (later entries).
 */
export const kComparisonEditionColours: string[] = [
    '#b71c1c',  // red 900
    '#455a64',  // blueGrey 700
    '#78909c',  // blueGrey 400
    '#b0bec5',  // blueGrey 200
];

/**
 * Props accepted by the <ComparisonGraph> component.
 */
interface ComparisonGraphProps {
    /**
     * Number of days that the comparison is valid for.
     */
    days: number;

    /**
     * Maximum height of the graph, in pixels. Defaults to 300px.
     */
    height?: number;

    /**
     * The data that should be shown on the comparison graph.
     */
    series: SalesGraphProps['series'];
}

/**
 * The <ComparisonGraph> component displays a graph comparing sales across multiple years. Series
 * will be coloured based on how far in the past the event happened.
 */
export async function ComparisonGraph(props: ComparisonGraphProps) {
    const xLabels: string[] = [];

    for (let label = props.days; label >= 0; --label)
        xLabels.push(label.toString());

    return (
        <SalesGraph height={props.height} series={props.series} xLabels={xLabels} zoom
                    sx={{
                        [ '& .MuiLineElement-series-1' ]: { strokeWidth: 3 },
                        [ '& .MuiLineElement-series-2' ]: { strokeWidth: 1 },
                        [ '& .MuiLineElement-series-3' ]: { strokeWidth: 1 },
                        [ '& .MuiLineElement-series-4' ]: { strokeWidth: 1 },
                    }} />
    );
}
