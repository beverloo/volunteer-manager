// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Stack from '@mui/material/Stack';

import type { SalesProduct } from './SalesGraphUtils';
import { type EventSalesCategory, kEventSalesCategory } from '@lib/database/Types';
import { SalesLineGraph } from './SalesLineGraph';
import { Temporal, isBefore, isAfter } from '@lib/Temporal';
import { TicketSalesComparisonAction } from './TicketSalesComparisonAction';
import { TicketSalesComparisonGraph } from './TicketSalesComparisonGraph';
import { TicketSalesGrowthComparisonAction } from './TicketSalesGrowthComparisonAction';
import { TicketSalesGrowthComparisonGraph } from './TicketSalesGrowthComparisonGraph';
import { TicketSalesInsightsAction } from './TicketSalesInsightsAction';
import { generateSeriesForProducts, generateXLabels } from './SalesGraphUtils';
import db, { tEvents, tEventsSalesConfiguration } from '@lib/database';

import { kTicketSalesComparisonEditionCount } from './TicketSalesComparisonGraph';

/**
 * Props accepted by the <TicketSalesGraph> component.
 */
export interface TicketSalesGraphProps {
    /**
     * Category of sales for which this graph is being displayed.
     */
    category: EventSalesCategory;

    /**
     * Unique ID of the event for which data should be displayed.
     */
    eventId: number;

    /**
     * Products that will be counted towards this graph.
     */
    products: SalesProduct[];

    /**
     * Range of the graph, indicated as the first and last date to display. Dates must be formatted
     * in a Temporal PlainDate-compatible format.
     */
    range: [ string, string ];
}

/**
 * The <TicketSalesGraph> component displays a graph specific to the sales of tickets.
 */
export async function TicketSalesGraph(props: TicketSalesGraphProps) {
    const start = Temporal.PlainDate.from(props.range[0]);
    const end = Temporal.PlainDate.from(props.range[1]);

    // ---------------------------------------------------------------------------------------------
    // Determine the title of the graph. This is based on the category, as various products could
    // together make up for a single category. (E.g. staggered pricing models.)

    let title: string;
    switch (props.category) {
        case kEventSalesCategory.TicketFriday:
            title = 'Tickets (Friday)';
            break;
        case kEventSalesCategory.TicketSaturday:
            title = 'Tickets (Saturday)';
            break;
        case kEventSalesCategory.TicketSunday:
            title = 'Tickets (Sunday)';
            break;
        case kEventSalesCategory.TicketWeekend:
            title = 'Tickets (Full weekend)';
            break;
        default:
            throw new Error(`Unsupported category given: ${props.category}`);
    }

    // ---------------------------------------------------------------------------------------------
    // Determine the events that should be compared. This will be based on the event that has been
    // selected, and the number of editions that should be compared.

    const dbInstance = db;

    const events = await dbInstance.selectFrom(tEvents)
        .innerJoin(tEventsSalesConfiguration)
            .on(tEventsSalesConfiguration.eventId.equals(tEvents.eventId))
                .and(tEventsSalesConfiguration.saleCategory.equals(props.category))
        .where(tEvents.eventId.lessOrEquals(props.eventId))
        .select({
            id: tEvents.eventId,
            name: tEvents.eventShortName,
            products:
                dbInstance.aggregateAsArrayOfOneColumn(tEventsSalesConfiguration.saleId),
        })
        .groupBy(tEvents.eventId)
        .orderBy(tEvents.eventEndTime, 'desc')
        .limit(kTicketSalesComparisonEditionCount)
        .executeSelectMany();

    // ---------------------------------------------------------------------------------------------
    // Determine series of the graph. A series is created for each of the products, which is
    // important because we might want to distinguish between tickets for adults and children.

    const series = await generateSeriesForProducts(
        props.eventId, props.products, start, end, /* includeAggregate= */ true);

    // ---------------------------------------------------------------------------------------------
    // Start preloading the comparison graph. It will only be shown when the graph is activated by
    // the user, but it depends on a fair number of queries.

    const action = (
        <Stack direction="row" spacing={1}>
            <TicketSalesInsightsAction events={events} title={title} />

            <TicketSalesGrowthComparisonAction
                graph={
                    <TicketSalesGrowthComparisonGraph categories={[ props.category ]}
                                                      events={events} />
                }
                title={title} />

            <TicketSalesComparisonAction
                graph={ <TicketSalesComparisonGraph events={events} /> }
                title={title} />
        </Stack>
    );

    // ---------------------------------------------------------------------------------------------

    const currentPlainDate = Temporal.Now.plainDateISO();
    const today =
        (!isBefore(currentPlainDate, start) && !isAfter(currentPlainDate, end))
            ? currentPlainDate.toString()
            : undefined;

    const xLabels = generateXLabels(start, end);

    return (
        <SalesLineGraph action={action} series={series} title={title} today={today}
                        xLabels={xLabels} />
    );
}
