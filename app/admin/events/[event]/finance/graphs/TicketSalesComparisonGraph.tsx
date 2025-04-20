// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { SalesLineGraphProps } from './SalesLineGraph';
import { ComparisonGraph, kComparisonEditionColours } from './ComparisonGraph';
import db, { tEvents, tEventsSales, tEventsSalesConfiguration } from '@lib/database';

/**
 * How many days should be compared within the comparable graphs?
 */
export const kTicketSalesComparisonDays = 90;

/**
 * How many editions should be compared within the comparable graphs, including the selected one?
 */
export const kTicketSalesComparisonEditionCount = kComparisonEditionColours.length;

/**
 * Events that are to be considered for the comparison.
 */
type TicketSalesComparisonEvent = {
    /**
     * Unique ID of the event as it exists in the database.
     */
    id: number;

    /**
     * Label that represents the name of the event.
     */
    name: string;

    /**
     * Set of products that are in scope for the comparison for this event.
     */
    products: number[];

    /**
     * Whether the graph should display revenue information as opposed to sale counts.
     */
    revenue?: boolean;
};

/**
 * Create a series for each of the events that should be compared. This requires a query per
 * edition. The series will be coloured based on how far in the past the event happened.
 */
export async function getTicketSalesComparisonSeries(
    events: TicketSalesComparisonEvent[], revenue?: boolean): Promise<SalesLineGraphProps['series']>
{
    const series: SalesLineGraphProps['series'] = [];

    const dbInstance = db;
    const daysFromEvent = dbInstance.fragmentWithType('int', 'required')
        .sql`DATEDIFF(${tEvents.eventStartTime}, ${tEventsSales.eventSaleDate})`;

    let currentSeriesColourIndex = 0;
    let currentId = 1;

    for (const event of events) {
        const salesData = await dbInstance.selectFrom(tEventsSales)
            .innerJoin(tEvents)
                .on(tEvents.eventId.equals(tEventsSales.eventId))
            .innerJoin(tEventsSalesConfiguration)
                .on(tEventsSalesConfiguration.saleId.equals(tEventsSales.eventSaleId))
            .where(tEventsSales.eventId.equals(event.id))
                .and(tEventsSales.eventSaleId.in(event.products))
            .select({
                days: daysFromEvent,

                sales: dbInstance.sum(tEventsSales.eventSaleCount),
                revenue: dbInstance.sum(
                    tEventsSales.eventSaleCount.multiply(tEventsSalesConfiguration.salePrice)),
            })
            .groupBy(tEventsSales.eventSaleDate)
            .orderBy('days', 'desc')
            .executeSelectMany();

        let aggregateSales: number = 0;

        const aggregateSalesData: number[] = [ /* no data yet */ ];

        for (const data of salesData) {
            const value = !!revenue ? data.revenue : data.sales;

            if (data.days < 0 || value === undefined)
                break;  // ignore this data; the sale happened after the convention(?!)

            aggregateSales += value;

            if (data.days > kTicketSalesComparisonDays)
                continue;  // the data is considered, but not included in the series

            aggregateSalesData.push(aggregateSales);
        }

        series.push({
            id: currentId++,
            data: aggregateSalesData,
            color: kComparisonEditionColours[currentSeriesColourIndex++],
            label: event.name,
            type: 'line',
        });
    }

    return series;
}

/**
 * Props accepted by the <TicketSalesComparisonGraph> component.
 */
export interface TicketSalesComparisonGraphProps {
    /**
     * Events that are to be included on the comparison graph.
     */
    events: TicketSalesComparisonEvent[];

    /**
     * Maximum height of the graph, in pixels. Defaults to 300px.
     */
    height?: number;

    /**
     * Whether the graph should display revenue information as opposed to sale counts.
     */
    revenue?: boolean;
}

/**
 * The <TicketSalesComparisonGraph> component displays a graph comparing ticket sales, either within
 * a single category or within multiple categories, between several years.
 */
export async function TicketSalesComparisonGraph(props: TicketSalesComparisonGraphProps) {
    const series = await getTicketSalesComparisonSeries(props.events, props.revenue);
    return (
        <ComparisonGraph days={kTicketSalesComparisonDays} height={props.height} series={series} />
    );
}
