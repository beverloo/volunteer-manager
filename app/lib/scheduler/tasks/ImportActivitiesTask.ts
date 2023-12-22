// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type Activity, createAnimeConClient } from '@lib/integrations/animecon';
import { Task } from '../Task';
import { dayjs } from '@lib/DateTime';
import db, { tActivities, tActivitiesTimeslots, tEvents } from '@lib/database';

/**
 * Interface describing the database representation of a stored activity on our end.
 */
export interface StoredActivity {
    id: number;
    created: Date;
    updated: Date;
    deleted?: Date;

    title: string;
    description?: string;
    url?: string;
    price?: number;
    maxVisitors?: number;
    visible: number;
    visibleReason?: string;

    type: {
        adultsOnly: number;
        competition: number;
        cosplay: number;
        event: number;
        gameRoom: number;
        video: number;
    },

    timeslots: {
        id: number;
        startTime: Date;
        endTime: Date;
        locationId: number;
        locationName: string;
    }[],
}

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

        // Fetch the activities from the AnimeCon API. This may throw an exception, in which case
        // the task execution will be considered unsuccessful -- which is fine.
        const currentActivities = await this.fetchActivitiesFromApi(festivalId!);
        if (!currentActivities.length) {
            this.log.warning('No activities were returned by the API, skipping.');
            return true;
        }

        // Fetch the current festival status from the database. A diff will be ran against this
        // information to make sure that the information in our database is up-to-date.
        const storedActivities = await this.fetchActivitiesFromDatabase(festivalId!);

        // TODO: Synchronise the API's activities with our database state.
        // - Create new activities
        // - Update existing activities
        // - Mark deleted activities as deleted

        return true;
    }

    // ---------------------------------------------------------------------------------------------

    async fetchActivitiesFromApi(festivalId: number): Promise<Activity[]> {
        const client = await createAnimeConClient();
        return client.getActivities({ festivalId });
    }

    async fetchActivitiesFromDatabase(festivalId: number): Promise<StoredActivity[]> {
        const dbInstance = db;
        return await db.selectFrom(tActivities)
            .innerJoin(tActivitiesTimeslots)
                .on(tActivitiesTimeslots.activityId.equals(tActivities.activityId))
            .where(tActivities.activityFestivalId.equals(festivalId))
            .select({
                id: tActivities.activityId,
                created: tActivities.activityCreated,
                updated: tActivities.activityUpdated,
                deleted: tActivities.activityDeleted,

                title: tActivities.activityTitle,
                description: tActivities.activityDescription,
                url: tActivities.activityUrl,
                price: tActivities.activityPrice,
                maxVisitors: tActivities.activityMaxVisitors,
                visible: tActivities.activityVisible,
                visibleReason: tActivities.activityVisibleReason,

                type: {
                    adultsOnly: tActivities.activityTypeAdultsOnly,
                    competition: tActivities.activityTypeCompetition,
                    cosplay: tActivities.activityTypeCosplay,
                    event: tActivities.activityTypeEvent,
                    gameRoom: tActivities.activityTypeGameRoom,
                    video: tActivities.activityTypeVideo,
                },

                timeslots: dbInstance.aggregateAsArray({
                    id: tActivitiesTimeslots.timeslotId,
                    startTime: tActivitiesTimeslots.timeslotStartTime,
                    endTime: tActivitiesTimeslots.timeslotEndTime,
                    locationId: tActivitiesTimeslots.timeslotLocationId,
                    locationName: tActivitiesTimeslots.timeslotLocationName,
                }),
            })
            .groupBy(tActivities.activityId)
            .executeSelectMany();
    }

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
