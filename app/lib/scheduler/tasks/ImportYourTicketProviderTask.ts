// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { YourTicketProviderTicketsResponse } from '@lib/integrations/yourticketprovider/YourTicketProviderTypes';
import { Task } from '../Task';
import { Temporal } from '@lib/Temporal';
import db, { tEvents, tEventsSalesConfiguration } from '@lib/database';

/**
 * Information made available for a particular event for which YourTicketProvider should be queried.
 */
interface EventInfo {
    id: number;
    name: string;
    endTime: Temporal.ZonedDateTime;
    yourTicketProviderId: number;
}

/**
 * Task that imports ticket sales information from YourTicketProvider. The applicable event(s) will
 * automatically be selected based on their configuration, whereas frequency of data imports will
 * be automatically altered based on proximity to the festival.
 */
export class ImportYourTicketProviderTask extends Task {
    /**
     * The default interval for the import task, when no precise granularity can be decided upon.
     */
    static readonly kIntervalMaximum = /* 2 days= */ 2 * 24 * 3600 * 1000;

    /**
     * Intervals for the tasks based on the number of days until the event happens.
     */
    static readonly kIntervalConfiguration = [
        { maximumDays: /* 4 weeks= */   28, intervalMs: /* 6 hours= */   6 * 3600 * 1000 },
        { maximumDays: /* 8 weeks= */   56, intervalMs: /* 12 hours= */ 12 * 3600 * 1000 },
        { maximumDays: /* 24 weeks= */ 168, intervalMs: /* 24 hours= */ 24 * 3600 * 1000 },
    ];

    /**
     * Actually executes the task.
     */
    override async execute(): Promise<boolean> {
        const dbInstance = db;

        const upcomingEvents = await this.determineApplicableUpcomingEvents(dbInstance);
        if (!upcomingEvents.length) {
            this.log.info('Interval: No future events with a ytpEventId, using maximum interval.');
            this.setIntervalForRepeatingTask(ImportYourTicketProviderTask.kIntervalMaximum);
            return true;
        }

        this.updateTaskIntervalForFestivalDate(upcomingEvents[0].endTime);

        for (const event of upcomingEvents)
            await this.executeForEvent(dbInstance, event);

        return true;
    }

    /**
     * Actually executes the task for the given `event`.
     */
    async executeForEvent(dbInstance: typeof db, event: EventInfo): Promise<void> {
        const configuration = await this.queryEventSalesConfiguration(dbInstance, event.id);

        const tickets = await this.fetchEventTicketsFromApi(event.yourTicketProviderId);
        if (!tickets?.length) {
            this.log.info(`${event.name}: No tickets were returned by the API; skipping`);
            return;
        }

        for (const ticketInfo of tickets) {
            let ticketConfiguration = configuration.get(ticketInfo.Id);
            if (!ticketConfiguration) {
                ticketConfiguration = {
                    id: ticketInfo.Id,

                    description: ticketInfo.Description,
                    limit: ticketInfo.Amount,
                    price: ticketInfo.Price,
                    product: ticketInfo.Name,
                };

                this.log.info(`${event.name}: Product "${ticketInfo.Name}" has been created.`);

                await dbInstance.insertInto(tEventsSalesConfiguration)
                    .set({
                        eventId: event.id,
                        eventSaleType: ticketInfo.Name,  // TODO: Get rid of name association?

                        saleId: ticketInfo.Id,
                        saleCategoryLimit: ticketInfo.Amount,
                        saleDescription: ticketInfo.Description,
                        salePrice: ticketInfo.Price,
                        saleProduct: ticketInfo.Name,
                    })
                    .executeInsert();
            }

            if (ticketConfiguration.product !== ticketInfo.Name ||
                ticketConfiguration.description !== ticketInfo.Description ||
                ticketConfiguration.price !== ticketInfo.Price ||
                ticketConfiguration.limit !== ticketInfo.Amount)
            {
                this.log.info(`${event.name}: Product "${ticketInfo.Name}" has been updated.`);

                await dbInstance.update(tEventsSalesConfiguration)
                    .set({
                        saleCategoryLimit: ticketInfo.Amount,
                        saleDescription: ticketInfo.Description,
                        saleProduct: ticketInfo.Name,
                    })
                    .where(tEventsSalesConfiguration.eventId.equals(event.id))
                        .and(tEventsSalesConfiguration.saleId.equals(ticketConfiguration.id))
                    .executeUpdate();
            }
        }

        // TODO
    }

    /**
     * Function that determines applicable upcoming events for importing data from the YTP API. This
     * means that the event (1) must not have ended yet, and (2) must have an associated YTP Event
     * ID for whihc information can be obtained.
     */
    async determineApplicableUpcomingEvents(dbInstance: typeof db): Promise<EventInfo[]> {
        return await dbInstance.selectFrom(tEvents)
            .where(tEvents.eventHidden.equals(/* false= */ 0))
                .and(tEvents.eventEndTime.lessOrEquals(dbInstance.currentZonedDateTime()))
                .and(tEvents.eventYtpId.isNotNull())
            .select({
                id: tEvents.eventId,
                name: tEvents.eventShortName,
                endTime: tEvents.eventEndTime,
                yourTicketProviderId: tEvents.eventYtpId,
            })
            .orderBy(tEvents.eventEndTime, 'desc')
            .executeSelectMany() as EventInfo[];
    }

    /**
     * Fetches the event ticket information from the YourTicketProvider API. Will issue a call to
     * their server, which may take an arbitrary time to complete.
     */
    async fetchEventTicketsFromApi(yourTicketProviderId: number)
        : Promise<YourTicketProviderTicketsResponse | undefined>
    {
        // getEventTickets
        return undefined;
    }

    /**
     * Queries the available event sales information from the database, for the given `eventId`.
     * Returns a Map keyed by the product's ID, and valued by its metadata.
     */
    async queryEventSalesConfiguration(dbInstance: typeof db, eventId: number) {
        const configuration = await dbInstance.selectFrom(tEventsSalesConfiguration)
            .where(tEventsSalesConfiguration.eventId.equals(eventId))
                .and(tEventsSalesConfiguration.saleId.isNotNull())
            .select({
                id: tEventsSalesConfiguration.saleId,

                description: tEventsSalesConfiguration.saleDescription,
                limit: tEventsSalesConfiguration.saleCategoryLimit,
                price: tEventsSalesConfiguration.salePrice,
                product: tEventsSalesConfiguration.saleProduct,
            })
            .executeSelectMany();

        return new Map(configuration.map(entry => ([ entry.id, entry ])));
    }

    /**
     * Updates the task's interval based on the distance between the current time and the given
     * `endTime`, effectively applying the `kIntervalConfiguration`.
     */
    updateTaskIntervalForFestivalDate(endTime: Temporal.ZonedDateTime): void {
        const differenceInDays = endTime.since(Temporal.Now.zonedDateTimeISO('UTC'), {
            largestUnit: 'days',
        }).days;

        for (const configurationEntry of ImportYourTicketProviderTask.kIntervalConfiguration) {
            const { maximumDays, intervalMs } = configurationEntry;

            if (differenceInDays > maximumDays)
                continue;

            this.log.info(`Interval: Updating to ${intervalMs}ms (days=${differenceInDays})`);
            this.setIntervalForRepeatingTask(intervalMs);
            return;
        }

        this.log.info('Interval: The event is still very far out, using maximum interval.');
        this.setIntervalForRepeatingTask(ImportYourTicketProviderTask.kIntervalMaximum);
    }
}
