// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { Task } from '../Task';
import db, { tEvents } from '@lib/database';

/**
 * This task is responsible for importing activities from AnPlan into our own database. The active
 * festival IDs will be read from the database, upon which the right APIs will be invoked.
 */
export class ImportActivitiesTask extends Task {
    /**
     * Maximum interval that will be applied when there are no upcoming events, in milliseconds.
     */
    static readonly kIntervalNoUpcomingEvents = /* 1 day= */ 86400000;

    // ---------------------------------------------------------------------------------------------

    override async execute(): Promise<boolean> {
        const upcomingEvent = await this.selectCurrentOrUpcomingEventWithFestivalId();
        if (!upcomingEvent) {
            this.log.warning('There are no upcoming events with a "festivalId" -- skipping.');
            this.setIntervalForRepeatingTask(ImportActivitiesTask.kIntervalNoUpcomingEvents);
            return true;
        }

        const { festivalEndTime, festivalId } = upcomingEvent;

        // TODO: Acquire all festival activities from the AnimeCon API.
        // TODO: Synchronise the API's activities with our database state.

        // TODO: Scale the interval of this task based on how far into the future the festival is.
        return true;
    }

    // ---------------------------------------------------------------------------------------------

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
