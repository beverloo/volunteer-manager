// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';

import { EventSalesGraph, type EventSalesConfidenceSeries, type EventSalesDataSeries } from './EventSalesGraph';
import { Temporal } from '@lib/Temporal';
import { createColourInterpolator } from '@app/admin/lib/createColourInterpolator';
import { getEventBySlug } from '@lib/EventLoader';
import db, { tEvents, tEventsSales } from '@lib/database';

/**
 * Props accepted by the <EventSales> component.
 */
export interface EventSalesProps {
    /**
     * Unique slug of the event for which sales information should be shown.
     */
    event: string;
}

/**
 * The <EventSales> component displays a graph of the event's ticket sales relative to previous
 * years. It's only available to event administrators, which generally maps to Staff level.
 */
export async function EventSales(props: EventSalesProps) {
    const kSalesGraphDays = 90;
    const kSalesGraphHistoryYears = 3;
    const kSalesGraphVariance = 0.005;
    const kSalesTypes = [ 'Friday', 'Saturday', 'Sunday', 'Weekend' ];

    const event = await getEventBySlug(props.event);
    if (!event)
        notFound();

    // TODO: Wait?

    // ---------------------------------------------------------------------------------------------
    // Fetch sales information from the database
    // ---------------------------------------------------------------------------------------------

    const daysUntilCurrentEvent = event.temporalStartTime.until(
        Temporal.Now.zonedDateTimeISO('utc'), { largestUnit: 'days' }).days;

    const historicCutoffDate = event.temporalStartTime.subtract({
        years: kSalesGraphHistoryYears,
    });

    const dbInstance = db;
    const daysFromEvent = dbInstance.fragmentWithType('int', 'required')
        .sql`DATEDIFF(${tEventsSales.eventSaleDate}, ${tEvents.eventStartTime})`;

    const events = await dbInstance.selectFrom(tEvents)
        .innerJoin(tEventsSales)
            .on(tEventsSales.eventId.equals(tEvents.eventId))
        .select({
            event: {
                name: tEvents.eventShortName,
                startTime: tEvents.eventStartTime,
                slug: tEvents.eventSlug,
            },
            data: dbInstance.aggregateAsArray({
                days: daysFromEvent,
                count: tEventsSales.eventSaleCount,
            }),
        })
        .where(tEvents.eventStartTime.greaterOrEquals(historicCutoffDate))
            .and(tEvents.eventLocation.equalsIfValue(event.location))
            .and(tEventsSales.eventSaleType.in(kSalesTypes))
        .groupBy(tEvents.eventId)
        .executeSelectMany();

    // ---------------------------------------------------------------------------------------------
    // Create data series out of the fetched sales information
    // ---------------------------------------------------------------------------------------------

    const colourInterpolator = createColourInterpolator('#263238,#ECEFF1');
    const colourForEvent = new Map<string, string>();

    const cumulativeSalesPerEvent = new Map<string, [ number, number ][]>();
    const cumulativeSamplesPerDay = new Map<number, number[]>();

    let latestCumulativeSales: number | undefined;
    let maximumY = 1;

    // Iteration (1): Decide on the graph's boundary values, initialise data structures
    {
        const min = 0 - kSalesGraphDays;
        const max = 0;

        for (const entry of events) {
            const isCurrentEvent = entry.event.slug === props.event;
            const sales = new Map<number, number>();

            colourForEvent.set(entry.event.slug, '#388E3C');

            if (!isCurrentEvent) {
                const differenceInYears = event.temporalStartTime.since(entry.event.startTime, {
                    largestUnit: 'days',
                }).days / 365;

                // Darw the line in a grey that's proportional to how far the event is in the past,
                // i.e. the event furthest in the history will receive the lightest visual colour.
                colourForEvent.set(entry.event.slug,
                    colourInterpolator(differenceInYears / kSalesGraphHistoryYears));
            }

            for (const { days, count } of entry.data) {
                const index = Math.max(min, Math.min(max, days));
                const value = sales.get(index) || 0;
                sales.set(index, value + count);
            }

            const cumulative: [ number, number ][] = [];

            let cumulativeCarry = 0;
            let cumulativeSampleBaseline = 0;

            for (let index = min; index <= max; ++index) {
                cumulativeCarry += sales.get(index) || 0;
                cumulative.push([ index, cumulativeCarry ]);

                if (cumulativeCarry > maximumY)
                    maximumY = cumulativeCarry;

                if (index === daysUntilCurrentEvent)
                    cumulativeSampleBaseline = cumulativeCarry;

                // Store the number of sales that have happened since |cumulativeSampleBaseline| for
                // this event as a sample, in case we calculate a future confidence interval.
                if (!isCurrentEvent && daysUntilCurrentEvent <= 0) {
                    const currentSamples = cumulativeSamplesPerDay.get(index) || [];
                    cumulativeSamplesPerDay.set(index, [
                        ...currentSamples,
                        cumulativeCarry - cumulativeSampleBaseline
                    ]);
                }

                // Stop drawing the line for the current event when it would be past today's data,
                // and we validate that by confirming that no further data is available.
                if (isCurrentEvent && daysUntilCurrentEvent <= 0) {
                    latestCumulativeSales = cumulativeCarry;
                    if (index >= daysUntilCurrentEvent && !sales.has(index))
                        break;
                }
            }

            cumulativeSalesPerEvent.set(entry.event.slug, cumulative);
        }
    }

    // ---------------------------------------------------------------------------------------------
    // Compute a confidence interval if the event has not started yet. This does not use any
    // particularly accurate method for computation, but rather an impression based on historic
    // averages, which admittedly isn't a lot of data to be confident about.
    // ---------------------------------------------------------------------------------------------

    let confidenceInterval: EventSalesConfidenceSeries | undefined;
    if (daysUntilCurrentEvent < 0 && !!latestCumulativeSales) {
        confidenceInterval = {
            colour: '#C8E6C9',
            data: [ /* empty */ ],
        };

        let optimisticVariance = 0;
        let pessimisticVariance = 0;

        for (let daysRemaining = daysUntilCurrentEvent; daysRemaining <= 0; ++daysRemaining) {
            const samples = cumulativeSamplesPerDay.get(daysRemaining);
            if (!samples)
                continue;

            const mean = samples.reduce((p, carry) => p + carry, 0) / samples.length;

            const optimisticSales = latestCumulativeSales + mean * (1.25 + optimisticVariance);
            optimisticVariance += kSalesGraphVariance;

            const pessimisticSales = latestCumulativeSales + mean * (0.75 - pessimisticVariance);
            pessimisticVariance += kSalesGraphVariance;

            confidenceInterval.data.push([
                daysRemaining,
                optimisticSales,
                pessimisticSales,
            ]);
        }
    }

    // ---------------------------------------------------------------------------------------------

    const series: EventSalesDataSeries[] = [];

    const xAxis = { abs: true, min: 0 - kSalesGraphDays, max: 0 };
    const yAxis = { min: 0, max: maximumY };

    // Iteration (2): Populate the formatted data into the |series|
    for (const [ eventSlug, data ] of cumulativeSalesPerEvent.entries()) {
        series.push({
            colour: colourForEvent.get(eventSlug)!,
            data,
            width: eventSlug === event.slug
                ? /* current= */ 3
                : /* historic= */ 1.25,
        });
    }

    // ---------------------------------------------------------------------------------------------

    return (
        <EventSalesGraph confidenceInterval={confidenceInterval} series={series}
                         today={daysUntilCurrentEvent} xAxis={xAxis} yAxis={yAxis} />
    );
}

/**
 * The <EventSalesLoading> component is shown instead of the <EventSales> component while it is
 * still loading.
 */
export function EventSalesLoading() {
    return (
        <Box sx={{ p: 2 }}>
            <Skeleton animation="wave" height={10} width="95%" />
            <Skeleton animation="wave" height={10} width="92%" />
            <Skeleton animation="wave" height={10} width="100%" />
            <Skeleton animation="wave" height={10} width="98%" />
        </Box>
    );
}

