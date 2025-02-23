// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { ResponsiveChartContainerProps } from '@mui/x-charts/ResponsiveChartContainer';

import type { EventSalesCategory } from '@lib/database/Types';
import { SalesGraph } from './SalesGraph';
import { Temporal, isBefore, isAfter } from '@lib/Temporal';
import db, { tActivities, tEventsSales } from '@lib/database';

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
    const start = Temporal.PlainDate.from(props.range[0]);
    const end = Temporal.PlainDate.from(props.range[1]);

    const dbInstance = db;

    // TODO: Enable linking the user through to the associated activity

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

                data.push(totalProductSales > 0 ? totalProductSales
                                                : null);
            }

            series.push({
                data,
                label: product,
                type: 'line',
            });
        }
    }

    // ---------------------------------------------------------------------------------------------

    const currentPlainDate = Temporal.Now.plainDateISO();
    const today =
        (!isBefore(currentPlainDate, start) && !isAfter(currentPlainDate, end))
            ? currentPlainDate.toString()
            : undefined;

    return (
        <SalesGraph limit={props.limit} series={series} title={title} today={today}
                    xLabels={xLabels} />
    );
}
