// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { useId } from 'react';

import { ResponsiveChartContainer, type ResponsiveChartContainerProps } from '@mui/x-charts/ResponsiveChartContainer';
import { ChartsClipPath } from '@mui/x-charts/ChartsClipPath';
import { ChartsReferenceLine } from '@mui/x-charts/ChartsReferenceLine';
import { ChartsTooltip } from '@mui/x-charts/ChartsTooltip/ChartsTooltip';
import { ChartsXAxis } from '@mui/x-charts/ChartsXAxis';
import { ChartsYAxis } from '@mui/x-charts/ChartsYAxis';
import { LinePlot } from '@mui/x-charts/LineChart';
import Typography from '@mui/material/Typography';

import type { EventSalesCategory } from '@lib/database/Types';
import { Temporal, isBefore, isAfter } from '@lib/Temporal';
import db, { tActivities, tEventsSales } from '@lib/database';

import { kMaximumColor, kTodayColor } from './GraphCommon';

/**
 * Props accepted by the <EventSalesGraph> component.
 */
export interface EventSalesGraphProps {
    /**
     * Unique ID of the activity for which this graph is being displayed.
     */
    activityId?: number;

    /**
     * Category of sales for which this graph is being displayed.
     */
    category: EventSalesCategory;

    /**
     * Unique ID of the event for which data should be displayed.
     */
    eventId: number;

    /**
     * Optional limit indicating the maximum number of tickets that can be sold.
     */
    limit?: number;

    /**
     * String of products that will be counted towards this graph.
     */
    products: string[];

    /**
     * Range of the graph, indicated as the first and last date to display. Dates must be formatted
     * in a Temporal PlainDate-compatible format.
     */
    range: [ string, string ];
}

/**
 * The <EventSalesGraph> component displays a graph specific to the sales of a particular event part
 * of one of our festivals. Sales of this kind may have a limit set as well.
 */
export async function EventSalesGraph(props: EventSalesGraphProps) {
    const today = Temporal.Now.plainDateISO();
    const start = Temporal.PlainDate.from(props.range[0]);
    const end = Temporal.PlainDate.from(props.range[1]);

    const clipPathId = useId();
    const dbInstance = db;

    // TODO: Enable linking the user through to the associated activity
    // TODO: Enable hover dialogs to indicate what's being looked at
    // TODO: Consider enabling a grid on the graph, for additional clarity

    // ---------------------------------------------------------------------------------------------
    // Determine the title of the graph. When an Activity ID is given this will be used, with the
    // label of the first product being the fallback.

    let title = props.products[0];

    if (!!props.activityId) {
        title = await dbInstance.selectFrom(tActivities)
            .where(tActivities.activityId.equals(props.activityId))
                .and(tActivities.activityDeleted.isNull())
            .selectOneColumn(tActivities.activityTitle)
            .executeSelectNoneOrOne() ?? props.products[0];
    }

    // ---------------------------------------------------------------------------------------------
    // Determine labels on the X axis. This will be the range of dates displayed on the graph, which
    // is controlled by the |start| and |end| properties.

    const xLabels = [];

    for (let date = start; !isAfter(date, end); date = date.add({ days: 1 }))
        xLabels.push(date.toString());

    // ---------------------------------------------------------------------------------------------
    // Determine series of the graph. A series is created for each of the products, and one more
    // series showing total sales across them in case there are multiple.

    const series: ResponsiveChartContainerProps['series'] = [];
    {
        type SeriesData = Map<string, number>;
        type SeriesMap = Map<string, SeriesData>;

        const salesDatabaseData = await dbInstance.selectFrom(tEventsSales)
            .where(tEventsSales.eventId.equals(props.eventId))
                .and(tEventsSales.eventSaleType.in(props.products))
            .select({
                date: dbInstance.dateAsString(tEventsSales.eventSaleDate),
                type: tEventsSales.eventSaleType,
                count: tEventsSales.eventSaleCount,
            })
            .executeSelectMany();

        const salesData: SeriesMap = new Map();
        for (const entry of salesDatabaseData) {
            if (!salesData.has(entry.type))
                salesData.set(entry.type, new Map());

            salesData.get(entry.type)!.set(entry.date, entry.count);
        }

        for (const product of props.products) {
            if (!salesData.has(product))
                continue;  // no sales data, skip this product

            const productSalesData = salesData.get(product)!;
            let totalProductSales = 0;

            const data = [];

            for (let date = start; !isAfter(date, end); date = date.add({ days: 1 })) {
                const productSales = productSalesData.get(date.toString());
                if (productSales !== undefined && productSales > 0)
                    totalProductSales += productSales;

                data.push(totalProductSales);
            }

            series.push({
                data,
                label: product,
                type: 'line',
            });
        }
    }

    // ---------------------------------------------------------------------------------------------

    return (
        <>
            <Typography variant="h5">
                {title}
            </Typography>
            <ResponsiveChartContainer series={series} height={300} margin={{ top: 24 }}
                                      xAxis={[ { scaleType: 'point', data: xLabels } ]}>
                <g clipPath={clipPathId}>
                    <LinePlot />
                    { (!isBefore(today, start) && !isAfter(today, end)) &&
                        <ChartsReferenceLine x={today.toString()}
                                            lineStyle={{
                                                stroke: kTodayColor
                                            }} /> }
                    { !!props.limit &&
                        <ChartsReferenceLine y={props.limit}
                                            lineStyle={{
                                                strokeDasharray: 4,
                                                stroke: kMaximumColor
                                            }} /> }
                </g>
                <ChartsTooltip />
                <ChartsXAxis />
                <ChartsYAxis />
                <ChartsClipPath id={clipPathId} />
            </ResponsiveChartContainer>
        </>
    );
}
