// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { EventSalesCategory } from '@lib/database/Types';
import type { SalesLineGraphProps } from './SalesLineGraph';
import { SalesBarGraph } from './SalesBarGraph';
import db, { tEvents, tEventsSales, tEventsSalesConfiguration } from '@lib/database';

import { kComparisonEditionColours } from './ComparisonGraph';
import { kTicketSalesComparisonDays } from './TicketSalesComparisonGraph';

/**
 * How many editions should be compared within the comparable graphs, including the selected one?
 */
const kTicketSalesComparisonEditionCount = kComparisonEditionColours.length;

/**
 * Props accepted by the <TicketSalesGrowthComparisonGraph> component.
 */
interface TicketSalesGrowthComparisonGraphProps {
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
 * The <TicketSalesGrowthComparisonGraph> component displays a bar graph comparing 7-day average
 * growth in ticket sales for the weeks leading up to the convention.
 */
export async function TicketSalesGrowthComparisonGraph(props: TicketSalesGrowthComparisonGraphProps) {
    const series: SalesLineGraphProps['series'] = [];

    const kWeeks = Math.floor(kTicketSalesComparisonDays / 7);

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

        const bucketedSalesData: number[][] = [];
        for (let bucket = 0; bucket < kWeeks; ++bucket)
            bucketedSalesData[bucket] = [ /* no data yet */ ];

        for (const data of salesData) {
            if (data.days < 0 || data.sales === undefined)
                break;  // ignore this data; the sale happened after the convention(?!)

            const bucket = Math.floor(data.days / 7);
            if (bucket < 0 || bucket >= kWeeks)
                continue;  // the bucket is out of bounds, won't be displayed

            bucketedSalesData[bucket].push(data.sales);
        }

        let averagedSalesData: number[] = [];

        for (let bucket = kWeeks - 1; bucket >= 0; --bucket) {
            if (!bucketedSalesData[bucket].length) {
                averagedSalesData.push(0);
            } else {
                averagedSalesData.push(
                    bucketedSalesData[bucket].reduce((a, b) => a + b, 0) /
                        bucketedSalesData[bucket].length);
            }
        }

        series.push({
            id: currentId++,
            data: averagedSalesData,
            color: kComparisonEditionColours[currentSeriesColourIndex++],
            label: event.name,
            type: 'bar',
        });
    }

    // ---------------------------------------------------------------------------------------------

    const xLabels: string[] = [];

    for (let week = kWeeks - 1; week >= 0; --week)
        xLabels.push(`${week * 7}–${(week + 1) * 7}`);

    return (
        <SalesBarGraph height={props.height} series={series} xLabels={xLabels} />
    );
}
