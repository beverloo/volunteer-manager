// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Link from 'next/link';

import EventNoteIcon from '@mui/icons-material/EventNote';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import type { EventSalesCategory } from '@lib/database/Types';
import { SalesGraph, type SalesGraphProps } from './SalesGraph';
import { Temporal, isBefore, isAfter } from '@lib/Temporal';
import { generateSeriesForProducts, generateXLabels } from './SalesGraphUtils';
import db, { tActivities, tEvents } from '@lib/database';

/**
 * Props accepted by the <EventSalesGraph> component.
 */
export interface EventSalesGraphProps {
    /**
     * Unique ID of the activity for which this graph is being displayed.
     */
    activityId?: number;

    /**
     * Category of sales for which this graph is being displayed.
     */
    category: EventSalesCategory;

    /**
     * Unique ID of the event for which data should be displayed.
     */
    eventId: number;

    /**
     * Optional limit indicating the maximum number of tickets that can be sold.
     */
    limit?: number;

    /**
     * String of products that will be counted towards this graph.
     */
    products: string[];

    /**
     * Range of the graph, indicated as the first and last date to display. Dates must be formatted
     * in a Temporal PlainDate-compatible format.
     */
    range: [ string, string ];

    /**
     * Optional title. When omitted, the title will be inferred based on the first product.
     */
    title?: string;

    /**
     * Variant of the <Typography> component that should be used for the title. Defaults to "h5".
     */
    titleVariant?: SalesGraphProps['titleVariant'];
}

/**
 * The <EventSalesGraph> component displays a graph specific to the sales of a particular event part
 * of one of our festivals. Sales of this kind may have a limit set as well.
 */
export async function EventSalesGraph(props: EventSalesGraphProps) {
    const start = Temporal.PlainDate.from(props.range[0]);
    const end = Temporal.PlainDate.from(props.range[1]);

    const dbInstance = db;

    // ---------------------------------------------------------------------------------------------
    // Determine the title of the graph. When an Activity ID is given this will be used, with the
    // label of the first product being the fallback.

    let action: React.ReactNode;
    let title = props.title ?? props.products[0];

    if (!props.title && !!props.activityId) {
        const eventsJoin = tEvents.forUseInLeftJoin();

        const activityInfo = await dbInstance.selectFrom(tActivities)
            .leftJoin(eventsJoin)
                .on(eventsJoin.eventFestivalId.equals(tActivities.activityFestivalId))
            .where(tActivities.activityId.equals(props.activityId))
                .and(tActivities.activityDeleted.isNull())
            .select({
                title: tActivities.activityTitle,
                eventSlug: eventsJoin.eventSlug,
            })
            .executeSelectNoneOrOne();

        if (!!activityInfo) {
            const href =
                `/admin/events/${activityInfo.eventSlug}/program/activities/${props.activityId}`;

            title = activityInfo.title;
            action = (
                <Tooltip title="View activity">
                    <IconButton LinkComponent={Link} href={href}>
                        <EventNoteIcon color="info" fontSize="small" />
                    </IconButton>
                </Tooltip>
            );
        }
    }

    // ---------------------------------------------------------------------------------------------
    // Determine series of the graph. A series is created for each of the products, but for events
    // we do not include aggregate sales as that's difficult to consolidate with sales limits.

    const series = await generateSeriesForProducts(
        props.eventId, props.products, start, end, /* includeAggregate= */ false);

    // ---------------------------------------------------------------------------------------------

    const currentPlainDate = Temporal.Now.plainDateISO();
    const today =
        (!isBefore(currentPlainDate, start) && !isAfter(currentPlainDate, end))
            ? currentPlainDate.toString()
            : undefined;

    const xLabels = generateXLabels(start, end);

    return (
        <SalesGraph action={action} limit={props.limit} series={series} title={title}
                    titleVariant={props.titleVariant} today={today} xLabels={xLabels} />
    );
}
