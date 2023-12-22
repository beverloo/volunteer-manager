// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { Task } from '../Task';
import { dayjs } from '@lib/DateTime';
import db, { tEvents } from '@lib/database';

/**
 * This task is responsible for importing activities from AnPlan into our own database. The active
 * festival IDs will be read from the database, upon which the right APIs will be invoked.
 */
export class ImportActivitiesTask extends Task {
    /**
     * The default interval for the import task, when no precise granularity can be decided upon.
     */
    static readonly kIntervalMaximum = /* 1 week= */ 7 * 86400 * 1000;

    /**
     * Intervals for the tasks based on the number of days until the event happens.
     */
    static readonly kIntervalConfiguration = [
        { maximumDays: /* 2 weeks= */   14, intervalMs: /* 15 minutes= */     900 * 1000 },
        { maximumDays: /* 4 weeks= */   28, intervalMs: /* 1 hour= */        3600 * 1000 },
        { maximumDays: /* 8 weeks= */   56, intervalMs: /* 6 hours= */   6 * 3600 * 1000 },
        { maximumDays: /* 12 weeks= */  84, intervalMs: /* 12 hours= */ 12 * 3600 * 1000 },
        { maximumDays: /* 24 weeks= */ 168, intervalMs: /* 24 hours= */ 24 * 3600 * 1000 },
    ];

    // ---------------------------------------------------------------------------------------------

    override async execute(): Promise<boolean> {
        const upcomingEvent = await this.selectCurrentOrUpcomingEventWithFestivalId();
        if (!upcomingEvent) {
            this.log.info('Interval: No future events with a festivalId, using maximum interval.');
            this.setIntervalForRepeatingTask(ImportActivitiesTask.kIntervalMaximum);
            return true;
        }

        const { festivalEndTime, festivalId } = upcomingEvent;

        // The interval of this task depends on how close we are to the festival. The following
        // function will scale the task interval appropriate to this.
        this.updateTaskIntervalForFestivalDate(festivalEndTime);

        // TODO: Acquire all festival activities from the AnimeCon API.
        // TODO: Synchronise the API's activities with our database state.

        return true;
    }

    // ---------------------------------------------------------------------------------------------

    updateTaskIntervalForFestivalDate(endTime: Date): void {
        const differenceInDays = dayjs(endTime).diff(dayjs(), 'days');
        if (differenceInDays < 0) {
            this.log.info('Interval: The event happened in the past, using maximum interval.');
            this.setIntervalForRepeatingTask(ImportActivitiesTask.kIntervalMaximum);
            return;
        }

        for (const { maximumDays, intervalMs } of ImportActivitiesTask.kIntervalConfiguration) {
            if (differenceInDays > maximumDays)
                continue;

            this.log.info(`Interval: Updating to ${intervalMs}ms (days=${differenceInDays})`);
            this.setIntervalForRepeatingTask(intervalMs);
            return;
        }

        this.log.info('Interval: The event is still very far out, using maximum interval.');
        this.setIntervalForRepeatingTask(ImportActivitiesTask.kIntervalMaximum);
    }

    private async selectCurrentOrUpcomingEventWithFestivalId() {
        return await db.selectFrom(tEvents)
            .where(tEvents.eventEndTime.greaterOrEquals(db.currentDateTime()))
                .and(tEvents.eventFestivalId.isNotNull())
                .and(tEvents.eventHidden.equals(/* false= */ 0))
            .select({
                festivalEndTime: tEvents.eventEndTime,
                festivalId: tEvents.eventFestivalId,
            })
            .limit(/* only the first upcoming event= */ 1)
            .executeSelectNoneOrOne();
    }
}
