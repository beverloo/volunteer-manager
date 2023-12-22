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
    static readonly kIntervalDefault = /* 1 week= */ 7 * 86400 * 1000;

    /**
     * Interval, in milliseconds, for this task to execute at in the final four months.
     */
    static readonly kIntervalFinalFourMonths = /* 3 days= */ 3 * 86400 * 1000;

    /**
     * Interval, in milliseconds, for this task to execute at in the final two months.
     */
    static readonly kIntervalFinalTwoMonths = /* 1 day= */ 1 * 86400 * 1000;

    /**
     * Interval, in milliseconds, for this task to execute at in the final month.
     */
    static readonly kIntervalFinalMonth = /* 6 hours= */ 6 * 3600 * 1000;

    /**
     * Interval, in milliseconds, for this task to execute at in the final two weeks.
     */
    static readonly kIntervalFinalTwoWeeks = /* 15 minutes= */ 900 * 1000;

    /**
     * Maximum interval that will be applied when there are no upcoming events, in milliseconds.
     */
    static readonly kIntervalNoUpcomingEvents = /* 1 week= */ 7 * 86400 * 1000;

    // ---------------------------------------------------------------------------------------------

    override async execute(): Promise<boolean> {
        const upcomingEvent = await this.selectCurrentOrUpcomingEventWithFestivalId();
        if (!upcomingEvent) {
            this.log.warning('There are no upcoming events with a "festivalId" -- skipping.');
            this.setIntervalForRepeatingTask(ImportActivitiesTask.kIntervalNoUpcomingEvents);
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
        const differenceInDays = dayjs(endTime).diff(dayjs(), 'days', /* float= */ true);

        let intervalMs = ImportActivitiesTask.kIntervalDefault;
        if (differenceInDays < 0)
            intervalMs = ImportActivitiesTask.kIntervalNoUpcomingEvents;
        else if (differenceInDays < 14)
            intervalMs = ImportActivitiesTask.kIntervalFinalTwoWeeks;
        else if (differenceInDays < 30.25)
            intervalMs = ImportActivitiesTask.kIntervalFinalMonth;
        else if (differenceInDays < 60.50)
            intervalMs = ImportActivitiesTask.kIntervalFinalTwoMonths;
        else if (differenceInDays < 121)
            intervalMs = ImportActivitiesTask.kIntervalFinalFourMonths;

        this.setIntervalForRepeatingTask(intervalMs);
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
