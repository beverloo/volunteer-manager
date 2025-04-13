// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { Task } from '../Task';
import { Temporal } from '@lib/Temporal';
import db, { tEvents } from '@lib/database';

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
