// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { Suspense } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { LoadingGraph } from './LoadingGraph';
import { TicketSalesComparisonGraph, type TicketSalesComparisonGraphProps } from './TicketSalesComparisonGraph';
import { TicketSalesInsightsAction } from './TicketSalesInsightsAction';
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

    /**
     * Whether the graph should display revenue information as opposed to sale counts.
     */
    revenue?: boolean;

    /**
     * Title to display above the graph, if any. Will be outside of the suspense boundary.
     */
    title?: string;
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
        <>
            { !!props.title &&
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography noWrap variant="h5">
                        {props.title}
                    </Typography>
                    { !props.revenue &&
                        <Box justifySelf="flex-end">
                            <TicketSalesInsightsAction events={events} title="Combined ticket sales" />
                        </Box> }
                </Stack> }
            <Suspense fallback={ <LoadingGraph padding={props.loadingGraphPadding} /> }>
                <TicketSalesComparisonGraph events={events} height={props.height}
                                            revenue={props.revenue} />
            </Suspense>
        </>
    );
}
