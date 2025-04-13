// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { Suspense } from 'react';

import { LoadingGraph } from './LoadingGraph';
import { TicketSalesComparisonGraph, type TicketSalesComparisonGraphProps } from './TicketSalesComparisonGraph';
import db, { tEvents, tEventsSalesConfiguration } from '@lib/database';

import { kEventSalesCategory } from '@lib/database/Types';
import { kTicketSalesComparisonEditionCount } from './TicketSalesComparisonGraph';

/**
 * Props accepted by the <TicketSalesTopLineGraph> component.
 */
interface TicketSalesTopLineGraphProps {
    /**
     * Unique ID of the event for which the data should be displayed.
     */
    eventId: number;

    /**
     * Optional height that should be applied to the graph.
     */
    height?: number;

    /**
     * Optional padding that should be applied to the loading graph.
     */
    loadingGraphPadding?: number;
}

/**
 * The <TicketSalesTopLineGraph> component displays the top-line, multi-year comparison ticket sales
 * graph, which can be further split up for additional granularity on the finance page.
 */
export async function TicketSalesTopLineGraph(props: TicketSalesTopLineGraphProps) {
    const events: TicketSalesComparisonGraphProps['events'] = await db.selectFrom(tEvents)
        .innerJoin(tEventsSalesConfiguration)
            .on(tEventsSalesConfiguration.eventId.equals(tEvents.eventId))
                .and(tEventsSalesConfiguration.saleCategory.in([
                    kEventSalesCategory.TicketFriday,
                    kEventSalesCategory.TicketSaturday,
                    kEventSalesCategory.TicketSunday,
                    kEventSalesCategory.TicketWeekend,
                ]))
        .where(tEvents.eventId.lessOrEquals(props.eventId))
        .select({
            id: tEvents.eventId,
            name: tEvents.eventShortName,
            products:
                db.aggregateAsArrayOfOneColumn(tEventsSalesConfiguration.saleId),
        })
        .groupBy(tEvents.eventId)
        .orderBy(tEvents.eventEndTime, 'desc')
        .limit(kTicketSalesComparisonEditionCount)
        .executeSelectMany();

    return (
        <Suspense fallback={ <LoadingGraph padding={props.loadingGraphPadding} /> }>
            <TicketSalesComparisonGraph
                categories={[
                    kEventSalesCategory.TicketFriday,
                    kEventSalesCategory.TicketSaturday,
                    kEventSalesCategory.TicketSunday,
                    kEventSalesCategory.TicketWeekend,
                ]}
                events={events} height={props.height} />
        </Suspense>
    );
}
