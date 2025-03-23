// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { EventSalesCategory } from '@lib/database/Types';
import type { SalesGraphProps } from './SalesGraph';
import { ComparisonGraph, kComparisonEditionColours } from './ComparisonGraph';
import db, { tEvents, tEventsSales, tEventsSalesConfiguration } from '@lib/database';

/**
 * How many days should be compared within the comparable graphs?
 */
const kTicketSalesComparisonDays = 90;

/**
 * How many editions should be compared within the comparable graphs, including the selected one?
 */
const kTicketSalesComparisonEditionCount = kComparisonEditionColours.length;

/**
 * Props accepted by the <TicketSalesComparisonGraph> component.
 */
interface TicketSalesComparisonGraphProps {
    /**
     * Categories of sales for which this graph is being displayed.
     */
    categories: EventSalesCategory[];

    /**
     * Base event for which the comparison graph should be displayed. Previous events with sales
     * information will be automatically selected from the database.
     */
    eventId: number;

    /**
     * Maximum height of the graph, in pixels. Defaults to 300px.
     */
    height?: number;
}

/**
 * The <TicketSalesComparisonGraph> component displays a graph comparing ticket sales, either within
 * a single category or within multiple categories, between several years.
 */
export async function TicketSalesComparisonGraph(props: TicketSalesComparisonGraphProps) {
    const series: SalesGraphProps['series'] = [];

    const dbInstance = db;

    // ---------------------------------------------------------------------------------------------
    // Determine the events that should be compared. This will be based on the event that has been
    // selected, and the number of editions that should be compared.

    const events = await dbInstance.selectFrom(tEvents)
        .innerJoin(tEventsSalesConfiguration)
            .on(tEventsSalesConfiguration.eventId.equals(tEvents.eventId))
                .and(tEventsSalesConfiguration.saleCategory.in(props.categories))
        .where(tEvents.eventId.lessOrEquals(props.eventId))
        .select({
            id: tEvents.eventId,
            name: tEvents.eventShortName,
            products:
                dbInstance.aggregateAsArrayOfOneColumn(tEventsSalesConfiguration.eventSaleType),
        })
        .groupBy(tEvents.eventId)
        .orderBy(tEvents.eventEndTime, 'desc')
        .limit(kTicketSalesComparisonEditionCount)
        .executeSelectMany();

    // ---------------------------------------------------------------------------------------------
    // Create a series for each of the events that should be compared. This requires a query per
    // edition. The series will be coloured based on how far in the past the event happened.

    const daysFromEvent = dbInstance.fragmentWithType('int', 'required')
        .sql`DATEDIFF(${tEvents.eventStartTime}, ${tEventsSales.eventSaleDate})`;

    let currentSeriesColourIndex = 0;
    let currentId = 1;

    for (const event of events) {
        const salesData = await dbInstance.selectFrom(tEventsSales)
            .innerJoin(tEvents)
                .on(tEvents.eventId.equals(tEventsSales.eventId))
            .where(tEventsSales.eventId.equals(event.id))
                .and(tEventsSales.eventSaleType.in(event.products))
            .select({
                days: daysFromEvent,
                sales: dbInstance.sum(tEventsSales.eventSaleCount),
            })
            .groupBy(tEventsSales.eventSaleDate)
            .orderBy('days', 'desc')
            .executeSelectMany();

        let aggregateSales: number = 0;

        const aggregateSalesData: number[] = [ /* no data yet */ ];

        for (const data of salesData) {
            if (data.days < 0 || data.sales === undefined)
                break;  // ignore this data; the sale happened after the convention(?!)

            aggregateSales += data.sales;

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

    // ---------------------------------------------------------------------------------------------

    return (
        <ComparisonGraph days={kTicketSalesComparisonDays} height={props.height} series={series} />
    );
}
