// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { BarSeriesType } from '@mui/x-charts-pro';

import type { EventSalesCategory } from '@lib/database/Types';
import { SalesBarGraph } from './SalesBarGraph';
import db, { tEvents, tEventsSales } from '@lib/database';

import { kComparisonEditionColours } from './ComparisonGraph';
import { kTicketSalesComparisonDays, type TicketSalesComparisonGraphProps }
    from './TicketSalesComparisonGraph';

/**
 * Props accepted by the <TicketSalesGrowthComparisonGraph> component.
 */
interface TicketSalesGrowthComparisonGraphProps {
    /**
     * Categories of sales for which this graph is being displayed.
     */
    categories: EventSalesCategory[];

    /**
     * Events that are to be included on the comparison graph.
     */
    events: TicketSalesComparisonGraphProps['events'];

    /**
     * Maximum height of the graph, in pixels. Defaults to 300px.
     */
    height?: number;
}

/**
 * The <TicketSalesGrowthComparisonGraph> component displays a bar graph comparing 7-day average
 * growth in ticket sales for the weeks leading up to the convention.
 */
export async function TicketSalesGrowthComparisonGraph(
    props: TicketSalesGrowthComparisonGraphProps)
{
    const series: BarSeriesType[] = [];

    const kWeeks = Math.floor(kTicketSalesComparisonDays / 7);

    const dbInstance = db;

    // ---------------------------------------------------------------------------------------------
    // Create a series for each of the events that should be compared. This requires a query per
    // edition. The series will be coloured based on how far in the past the event happened.

    const daysFromEvent = dbInstance.fragmentWithType('int', 'required')
        .sql`DATEDIFF(${tEvents.eventStartTime}, ${tEventsSales.eventSaleDate})`;

    let currentSeriesColourIndex = 0;
    let currentId = 1;

    for (const event of props.events) {
        const salesData = await dbInstance.selectFrom(tEventsSales)
            .innerJoin(tEvents)
                .on(tEvents.eventId.equals(tEventsSales.eventId))
            .where(tEventsSales.eventId.equals(event.id))
                .and(tEventsSales.eventSaleId.in(event.products))
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

        const averagedSalesData: number[] = [];

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
