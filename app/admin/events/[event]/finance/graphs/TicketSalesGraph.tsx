// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { EventSalesCategory } from '@lib/database/Types';

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
    return (
        <>
            TicketSalesGraph ({props.category})
        </>
    );
}
