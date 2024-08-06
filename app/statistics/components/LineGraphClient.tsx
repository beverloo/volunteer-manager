// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useMemo } from 'react';

import { LineChart, type LineChartProps } from './LineChartProxy';

/**
 * Props accepted by the <LineGraphClient> component.
 */
type LineGraphClientProps = LineChartProps & {
    /**
     * Whether the values (0-1) should be formatted as percentages.
     */
    percentage?: boolean;
};

/**
 * The <LineGraphClient> component is the client-side version of the regular <LineGraph> component,
 * inserted as we need additional programmatic flexibility in configuring what the graph should be
 * displayed as - for example to format values for the tooltip.
 */
export function LineGraphClient(props: LineGraphClientProps) {
    const { percentage, series, ...rest } = props;

    const seriesMutated = useMemo(() => {
        if (percentage) {
            return series.map(serie => ({
                ...serie,
                valueFormatter: (v: any) => {
                    if (!v)
                        return '0%';

                    return `${Math.round(v * 100 * 10) / 10}%`;
                },
            }));
        }

        return series;

    }, [ percentage, series ]);

    return (
        <LineChart {...rest} series={seriesMutated} />
    );
}
