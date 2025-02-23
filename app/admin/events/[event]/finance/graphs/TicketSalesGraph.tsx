// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type EventSalesCategory, kEventSalesCategory } from '@lib/database/Types';
import { SalesGraph } from './SalesGraph';
import { Temporal, isBefore, isAfter } from '@lib/Temporal';
import { generateSeriesForProducts, generateXLabels } from './SalesGraphUtils';

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
            title = 'Tickets (Weekend)';
            break;
        default:
            throw new Error(`Unsupported category given: ${props.category}`);
    }

    // ---------------------------------------------------------------------------------------------
    // Determine series of the graph. A series is created for each of the products, which is
    // important because we might want to distinguish between tickets for adults and children.

    const series = await generateSeriesForProducts(
        props.eventId, props.products, start, end, /* includeAggregate= */ true);

    // ---------------------------------------------------------------------------------------------

    const currentPlainDate = Temporal.Now.plainDateISO();
    const today =
        (!isBefore(currentPlainDate, start) && !isAfter(currentPlainDate, end))
            ? currentPlainDate.toString()
            : undefined;

    const xLabels = generateXLabels(start, end);

    return (
        <SalesGraph series={series} title={title} today={today} xLabels={xLabels} />
    );
}
