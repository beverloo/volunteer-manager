// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { Suspense } from 'react';

import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid2';
import Paper from '@mui/material/Paper';

import type { NextPageParams } from '@lib/NextRouterParams';
import { SalesConfigurationSection } from './SalesConfigurationSection';
import { SalesUploadSection } from './SalesUploadSection';
import { Section } from '@app/admin/components/Section';
import { SectionIntroduction } from '@app/admin/components/SectionIntroduction';
import { Temporal } from '@lib/Temporal';
import { generateEventMetadataFn } from '../generateEventMetadataFn';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import { readUserSetting } from '@lib/UserSettings';
import db, { tEvents, tEventsSalesConfiguration, tEventsSales } from '@lib/database';

import { type EventSalesGraphProps, EventSalesGraph } from './graphs/EventSalesGraph';
import { type TicketSalesGraphProps, TicketSalesGraph } from './graphs/TicketSalesGraph';
import { LoadingGraph } from './graphs/LoadingGraph';
import { kEventSalesCategory } from '@lib/database/Types';

/**
 * The <EventFinancePage> page displays financial information of the event to those who have access
 * to it. Financial administrators can further upload new information, and change configuration that
 * controls which metrics should be displayed in the different graphs.
 */
export default async function EventFinancePage(props: NextPageParams<'event'>) {
    const { access, event, user } = await verifyAccessAndFetchPageInfo(props.params, {
        permission: 'statistics.finances',
    });

    const dbInstance = db;

    // Those who are allowed to manage an event's settings can manage financial information as well,
    // even though that does not necessarily mean that they can access the source data.
    const canManageFinances = access.can('event.settings', {
        event: event.slug,
    });

    // ---------------------------------------------------------------------------------------------
    // Determine the date ranges that should be displayed on the graphs. All graphs will show data
    // along the same X axes to make sure that they're visually comparable.

    const minimumRange = await dbInstance.selectFrom(tEventsSales)
        .where(tEventsSales.eventId.equals(event.id))
        .selectOneColumn(tEventsSales.eventSaleDate)
        .orderBy(tEventsSales.eventSaleDate, 'asc')
        .limit(1)
        .executeSelectNoneOrOne() ?? Temporal.Now.plainDateISO().subtract({ days: 90 });

    const maximumRange = await dbInstance.selectFrom(tEvents)
        .where(tEvents.eventId.equals(event.id))
        .selectOneColumn(tEvents.eventEndTime)
        .executeSelectNoneOrOne() ?? Temporal.Now.zonedDateTimeISO().add({ days: 14 });

    const range: [ string, string ] = [
        minimumRange.toString(),
        maximumRange.toPlainDate().toString()
    ];

    // ---------------------------------------------------------------------------------------------
    // Determine that graphs that have to be displayed. This is depending on the configuration that
    // has been set for the event. Ticket graphs will be displayed before event graphs.

    const graphs = await dbInstance.selectFrom(tEventsSalesConfiguration)
        .where(tEventsSalesConfiguration.eventId.equals(event.id))
            .and(tEventsSalesConfiguration.saleCategory.isNotNull())
        .select({
            category: tEventsSalesConfiguration.saleCategory,
            categoryLimit: tEventsSalesConfiguration.saleCategoryLimit,
            saleEventId: tEventsSalesConfiguration.saleEventId,
            saleTypes:
                dbInstance.aggregateAsArrayOfOneColumn(tEventsSalesConfiguration.eventSaleType),
        })
        .groupBy(tEventsSalesConfiguration.saleCategory, tEventsSalesConfiguration.saleEventId)
        .executeSelectMany();

    const eventGraphs: EventSalesGraphProps[] = [ /* no graphs */ ];
    const ticketGraphs: TicketSalesGraphProps[] = [ /* no graphs */ ];

    for (const graph of graphs) {
        switch (graph.category) {
            case kEventSalesCategory.Event:
                eventGraphs.push({
                    activityId: graph.saleEventId,
                    category: graph.category,
                    eventId: event.id,
                    limit: graph.categoryLimit,
                    products: graph.saleTypes,
                    range,
                });
                break;

            case kEventSalesCategory.Locker:
                // TODO: Figure out what to do with lockers?
                break;

            case kEventSalesCategory.TicketFriday:
            case kEventSalesCategory.TicketSaturday:
            case kEventSalesCategory.TicketSunday:
            case kEventSalesCategory.TicketWeekend:
                ticketGraphs.push({
                    category: graph.category,
                    eventId: event.id,
                    products: graph.saleTypes,
                    range,
                });
                break;

            default:
                console.warn(`Unrecognised graph category: ${graph.category}`);
                break;
        }
    }

    // ---------------------------------------------------------------------------------------------

    const configurationExpanded =
        await readUserSetting(user.userId, 'user-admin-event-finance-configuration') ?? false;

    return (
        <>
            <Section title="Financial information" subtitle={event.shortName}>
                <SectionIntroduction important>
                    Financial information regarding {event.shortName} is confidential, even within
                    the volunteering organisation. Do not share this information with anyone who
                    isn't AnimeCon Staff. Sales have to be manually imported and may thus be
                    delayed.
                </SectionIntroduction>
            </Section>
            <Grid container spacing={2}>
                { ticketGraphs.map((ticketGraphProps, index) =>
                    <Grid key={index} size={{ xs: 12, md: 6 }}>
                        <Section noHeader>
                            <Suspense fallback={ <LoadingGraph /> }>
                                <TicketSalesGraph {...ticketGraphProps} />
                            </Suspense>
                        </Section>
                    </Grid> )}
                { eventGraphs.map((eventGraphProps, index) =>
                    <Grid key={index} size={{ xs: 12, md: 6 }}>
                        <Section noHeader>
                            <Suspense fallback={ <LoadingGraph /> }>
                                <EventSalesGraph {...eventGraphProps} />
                            </Suspense>
                        </Section>
                    </Grid> )}
                { (!ticketGraphs.length && !eventGraphs.length) &&
                    <Grid size={12}>
                        <Paper elevation={1} sx={{ p: 1.75 }}>
                            <Alert severity="error" variant="outlined">
                                No financial information is available, or has been configured for
                                this event yet.
                            </Alert>
                        </Paper>
                    </Grid> }
            </Grid>
            { canManageFinances &&
                <SalesConfigurationSection event={event.slug} expanded={configurationExpanded} /> }
            { canManageFinances &&
                <SalesUploadSection event={event.slug} /> }
        </>
    );
}

export const generateMetadata = generateEventMetadataFn('Financial information');
