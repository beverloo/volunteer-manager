// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { AllSeriesType } from './MuiChartProxy';

import { Temporal, isAfter } from '@lib/Temporal';
import db, { tEvents, tEventsSales } from '@lib/database';

/**
 * Generates the series for a given set of products, associated with a given event. This function
 * will communicate with the database. Optionally the `includeAggregate` parameter can be set to
 * compute an additional series that combines the sales of all products, in case more than a single
 * product is included in the given `products` parameter.
 */
export async function generateSeriesForProducts(
    eventId: number, products: number[], start: Temporal.PlainDate, end: Temporal.PlainDate,
    includeAggregate: boolean)
{
    type SeriesData = Map<string, number>;
    type SeriesMap = Map<number, SeriesData>;

    // ---------------------------------------------------------------------------------------------

    const dbInstance = db;
    const series: AllSeriesType[] = [];

    const salesDatabaseData = await dbInstance.selectFrom(tEventsSales)
        .where(tEventsSales.eventId.equals(eventId))
            .and(tEventsSales.eventSaleId.in(products))
        .select({
            date: dbInstance.dateAsString(tEventsSales.eventSaleDate),
            product: tEventsSales.eventSaleId,
            count: tEventsSales.eventSaleCount,
        })
        .executeSelectMany();

    // ---------------------------------------------------------------------------------------------

    const aggregateSalesData: SeriesData = new Map();
    const salesData: SeriesMap = new Map();

    for (const entry of salesDatabaseData) {
        if (!salesData.has(entry.product))
            salesData.set(entry.product, new Map());

        salesData.get(entry.product)!.set(entry.date, entry.count);

        if (includeAggregate) {
            aggregateSalesData.set(
                entry.date, (aggregateSalesData.get(entry.date) || 0) + entry.count);
        }
    }

    for (const product of products) {
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
            label: /* FIXME: */` ${product}`,
            type: 'line',
        });
    }

    // ---------------------------------------------------------------------------------------------

    if (includeAggregate) {
        let totalProductSales = 0;

        const data = [];

        for (let date = start; !isAfter(date, end); date = date.add({ days: 1 })) {
            const productSales = aggregateSalesData.get(date.toString());
            if (productSales !== undefined && productSales > 0)
                totalProductSales += productSales;

            data.push(totalProductSales > 0 ? totalProductSales
                                            : null);
        }

        series.push({
            data,
            label: 'Total',
            type: 'line',
        });
    }

    return series;
}

/**
 * Generates the labels that are to be displayed on the x-axis of the graph.
 */
export function generateXLabels(start: Temporal.PlainDate, end: Temporal.PlainDate): string[] {
    const xLabels = [];

    for (let date = start; !isAfter(date, end); date = date.add({ days: 1 }))
        xLabels.push(date.toString());

    return xLabels;
}

/**
 * Selects the date range to use for graphs in context of the given `eventId`, returned as a string
 * array with two entries, each in a PlainDate-compatible format (YYYY-MM-DD).
 */
export async function selectRangeForEvent(eventId: number): Promise<[ string, string ]> {
    const minimumRange = await db.selectFrom(tEventsSales)
        .where(tEventsSales.eventId.equals(eventId))
        .selectOneColumn(tEventsSales.eventSaleDate)
        .orderBy(tEventsSales.eventSaleDate, 'asc')
        .limit(1)
        .executeSelectNoneOrOne() ?? Temporal.Now.plainDateISO().subtract({ days: 90 });

    const maximumRange = await db.selectFrom(tEvents)
        .where(tEvents.eventId.equals(eventId))
        .selectOneColumn(tEvents.eventEndTime)
        .executeSelectNoneOrOne() ?? Temporal.Now.zonedDateTimeISO().add({ days: 14 });

    return [
        minimumRange.toString(),
        maximumRange.toPlainDate().toString()
    ];
}
