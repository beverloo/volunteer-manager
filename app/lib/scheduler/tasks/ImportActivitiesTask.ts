// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { ExecutableInsert } from 'ts-sql-query/expressions/insert';
import type { ExecutableUpdate } from 'ts-sql-query/expressions/update';
import symmetricDifference from 'set.prototype.symmetricdifference';
import { z } from 'zod';

import { ActivityType } from '@lib/database/Types';
import { type Activity, type Timeslot, createAnimeConClient } from '@lib/integrations/animecon';
import { TaskWithParams } from '../Task';
import { dayjs } from '@lib/DateTime';
import db, { tActivities, tActivitiesTimeslots, tEvents } from '@lib/database';

/**
 * Parameter scheme applying to the `ImportActivitiesTask`.
 */
const kImportActivitiesTaskParamScheme = z.object({
    /**
     * The specific festival Id to import activities for. Optional - will default to the nearest
     * upcoming festival. The task will be forced to be a one-off when set.
     */
    festivalId: z.number().optional(),
});

/**
 * Type definition of the parameter scheme, to be used by TypeScript.
 */
type TaskParams = z.infer<typeof kImportActivitiesTaskParamScheme>;

/**
 * Severities that can be assigned to an individual mutation.
 */
type MutationSeverity = 'Low' | 'Moderate' | 'Important';

/**
 * Mutations are expressed as a set of queries (created by the `compareActivities` method) together
 * with a list of changes. The list deliberately is inspectable to enable testing.
 */
interface Mutations {
    created: ExecutableInsert<typeof tActivities | typeof tActivitiesTimeslots>[],
    updated: ExecutableUpdate<typeof tActivities | typeof tActivitiesTimeslots>[],
    deleted: ExecutableUpdate<typeof tActivities | typeof tActivitiesTimeslots>[],
    mutations: {
        activityId: number;
        activityTimeslotId?: number;
        mutation: 'Created' | 'Updated' | 'Deleted';
        severity: MutationSeverity;
    }[];
}

/**
 * This task is responsible for importing activities from AnPlan into our own database. The active
 * festival IDs will be read from the database, upon which the right APIs will be invoked.
 */
export class ImportActivitiesTask extends TaskWithParams<TaskParams> {
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

    override validate(params: unknown): TaskParams | never {
        return kImportActivitiesTaskParamScheme.parse(params);
    }

    override async execute(params: TaskParams): Promise<boolean> {
        const upcomingEvent = await this.selectCurrentOrUpcomingEventWithFestivalId(params);
        if (!upcomingEvent) {
            this.log.info('Interval: No future events with a festivalId, using maximum interval.');
            this.setIntervalForRepeatingTask(ImportActivitiesTask.kIntervalMaximum);
            return true;
        }

        const { festivalEndTime, festivalId } = upcomingEvent;

        // The interval of this task depends on how close we are to the festival, and will only be
        // set when no explicit `festivalId` was passed in this task's `params`.
        if (!params.festivalId)
            this.updateTaskIntervalForFestivalDate(festivalEndTime);
        else
            this.setIntervalForRepeatingTask(/* no interval= */ undefined);

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

        // Run the comparison. This yields the created, updated and deleted activities, together
        // with a list of mutations that will independently be written to the database.
        const mutations = this.compareActivities(currentActivities, storedActivities);

        // TODO: Update the database based on the given `mutations`.

        return true;
    }

    compareActivities(currentActivities: Activity[], storedActivities: StoredActivity[]) {
        const mutations: Mutations = {
            created: [],
            updated: [],
            deleted: [],
            mutations: [],
        };

        const dbInstance = db;

        // -----------------------------------------------------------------------------------------
        // Step 1: Gather IDs of entities in the stored program
        // -----------------------------------------------------------------------------------------

        const seenActivitiesInStoredProgram = new Map<number, StoredActivity>();
        const seenTimeslotsInStoredProgram = new Map<number, StoredTimeslot>();

        const timeslotToStoredActivity = new Map<number, StoredActivity>();

        for (const storedActivity of storedActivities) {
            seenActivitiesInStoredProgram.set(storedActivity.id, storedActivity);
            for (const storedTimeslot of storedActivity.timeslots) {
                seenTimeslotsInStoredProgram.set(storedTimeslot.id, storedTimeslot);
                timeslotToStoredActivity.set(storedTimeslot.id, storedActivity);
            }
        }

        // -----------------------------------------------------------------------------------------
        // Step 2: Gather IDs of entities in the current program
        // -----------------------------------------------------------------------------------------

        const seenActivitiesInCurrentProgram = new Map<number, Activity>();
        const seenTimeslotsInCurrentProgram = new Map<number, Timeslot>();

        const timeslotToCurrentActivity = new Map<number, Activity>();

        for (const currentActivity of currentActivities) {
            seenActivitiesInCurrentProgram.set(currentActivity.id, currentActivity);
            for (const currentTimeslot of currentActivity.timeslots) {
                seenTimeslotsInCurrentProgram.set(currentTimeslot.id, currentTimeslot);
                timeslotToCurrentActivity.set(currentTimeslot.id, currentActivity);
            }
        }

        // -----------------------------------------------------------------------------------------
        // Step 3: Identify program additions and removals
        // -----------------------------------------------------------------------------------------

        const addedOrRemovedActivities = symmetricDifference(
            new Set([ ...seenActivitiesInStoredProgram.keys() ]),
            new Set([ ...seenActivitiesInCurrentProgram.keys() ]));

        for (const activityId of addedOrRemovedActivities) {
            if (!seenActivitiesInStoredProgram.has(activityId)) {
                const currentActivity = seenActivitiesInCurrentProgram.get(activityId);
                if (!currentActivity)
                    throw new Error('Unrecognised new entry in seenActivitiesInCurrentProgram');

                mutations.created.push(dbInstance.insertInto(tActivities)
                    .set({
                        activityId: currentActivity.id,
                        activityFestivalId: currentActivity.festivalId,
                        activityType: ActivityType.Program,
                        activityTitle: currentActivity.title,
                        activityDescription: currentActivity.description,
                        activityUrl: currentActivity.url,
                        activityPrice: currentActivity.price,
                        activityHelpNeeded: 0,  // TODO: Store this field when the API exposes it
                        activityMaxVisitors: currentActivity.maxVisitors,
                        activityTypeAdultsOnly: currentActivity.activityType?.adultsOnly ? 1 : 0,
                        activityTypeCompetition: currentActivity.activityType?.competition ? 1 : 0,
                        activityTypeCosplay: currentActivity.activityType?.cosplay ? 1 : 0,
                        activityTypeEvent: currentActivity.activityType?.event ? 1 : 0,
                        activityTypeGameRoom: currentActivity.activityType?.gameRoom ? 1 : 0,
                        activityTypeVideo: currentActivity.activityType?.video ? 1 : 0,
                        activityVisible: currentActivity.visible ? 1 : 0,
                        activityVisibleReason: currentActivity.reasonInvisible,
                        activityCreated: dbInstance.currentDateTime(),
                        activityUpdated: dbInstance.currentDateTime(),
                        activityDeleted: undefined,
                    }));

                mutations.mutations.push({
                    activityId: currentActivity.id,
                    mutation: 'Created',
                    severity: this.maybeEscalateMutationSeverity(currentActivity, 'Moderate'),
                });

            } else {
                const storedActivity = seenActivitiesInStoredProgram.get(activityId);
                if (!storedActivity)
                    throw new Error('Unrecognised removed entry in seenActivitiesInStoredProgram');

                mutations.deleted.push(dbInstance.update(tActivities)
                    .set({
                        activityDeleted: dbInstance.currentDateTime(),
                    })
                    .where(tActivities.activityId.equals(storedActivity.id)));

                mutations.mutations.push({
                    activityId: storedActivity.id,
                    mutation: 'Deleted',
                    severity: this.maybeEscalateMutationSeverity(storedActivity, 'Moderate'),
                });
            }
        }

        const addedOrRemovedTimeslots = symmetricDifference(
            new Set([ ...seenTimeslotsInStoredProgram.keys() ]),
            new Set([ ...seenTimeslotsInCurrentProgram.keys() ]));

        for (const timeslotId of addedOrRemovedTimeslots) {
            if (!seenTimeslotsInStoredProgram.has(timeslotId)) {
                const currentActivity = timeslotToCurrentActivity.get(timeslotId);
                const currentTimeslot = seenTimeslotsInCurrentProgram.get(timeslotId);

                if (!currentActivity || !currentTimeslot)
                    throw new Error('Unrecognised new entry in seenTimeslotsInCurrentProgram');

                mutations.created.push(dbInstance.insertInto(tActivitiesTimeslots)
                    .set({
                        activityId: currentActivity.id,
                        timeslotId: currentTimeslot.id,
                        timeslotType: ActivityType.Program,
                        timeslotStartTime: new Date(currentTimeslot.dateStartsAt),
                        timeslotEndTime: new Date(currentTimeslot.dateEndsAt),
                        timeslotLocationId: currentTimeslot.location.id,
                        timeslotLocationName: currentTimeslot.location.name,
                        timeslotCreated: dbInstance.currentDateTime(),
                        timeslotUpdated: dbInstance.currentDateTime(),
                        timeslotDeleted: undefined,
                    }));

                mutations.mutations.push({
                    activityId: currentActivity.id,
                    activityTimeslotId: currentTimeslot.id,
                    mutation: 'Created',
                    severity: this.maybeEscalateMutationSeverity(currentActivity, 'Moderate'),
                });

            } else {
                const storedActivity = timeslotToStoredActivity.get(timeslotId);
                const storedTimeslot = seenTimeslotsInStoredProgram.get(timeslotId);

                if (!storedActivity || !storedTimeslot)
                    throw new Error('Unrecognised removed entry in seenTimeslotsInStoredProgram');

                mutations.deleted.push(dbInstance.update(tActivitiesTimeslots)
                    .set({
                        timeslotDeleted: dbInstance.currentDateTime(),
                    })
                    .where(tActivitiesTimeslots.timeslotId.equals(storedTimeslot.id)));

                mutations.mutations.push({
                    activityId: storedActivity.id,
                    activityTimeslotId: storedTimeslot.id,
                    mutation: 'Deleted',
                    severity: this.maybeEscalateMutationSeverity(storedActivity, 'Moderate'),
                });
            }
        }

        return mutations;
    }

    // ---------------------------------------------------------------------------------------------

    async fetchActivitiesFromApi(festivalId: number): Promise<Activity[]> {
        const client = await createAnimeConClient();
        return client.getActivities({ festivalId });
    }

    async fetchActivitiesFromDatabase(festivalId: number) {
        const dbInstance = db;
        return await db.selectFrom(tActivities)
            .innerJoin(tActivitiesTimeslots)
                .on(tActivitiesTimeslots.activityId.equals(tActivities.activityId))
                .and(tActivitiesTimeslots.timeslotType.equals(ActivityType.Program))
            .where(tActivities.activityFestivalId.equals(festivalId))
                .and(tActivities.activityType.equals(ActivityType.Program))
            .select({
                id: tActivities.activityId,
                created: tActivities.activityCreated,
                updated: tActivities.activityUpdated,
                deleted: tActivities.activityDeleted,

                title: tActivities.activityTitle,
                description: tActivities.activityDescription,
                url: tActivities.activityUrl,
                price: tActivities.activityPrice,
                helpNeeded: tActivities.activityHelpNeeded,
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

    // ---------------------------------------------------------------------------------------------

    maybeEscalateMutationSeverity(
        activity: Activity | StoredActivity, baseSeverity: MutationSeverity): MutationSeverity
    {
        // The severity of mutations gets escalated when the "help needed" flag has been set on an
        // event, which signals that explicit action from our team is requested.
        if ('helpNeeded' in activity && activity.helpNeeded === 1)
            return 'Important';

        // TODO: Consider the `helpNeeded` field in `Activity` when the API exposes it.

        return baseSeverity;
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

    private async selectCurrentOrUpcomingEventWithFestivalId(params: TaskParams) {
        const baseQuery = db.selectFrom(tEvents)
            .select({
                festivalEndTime: tEvents.eventEndTime,
                festivalId: tEvents.eventFestivalId,
            })
            .limit(/* only the first (upcoming) event= */ 1);

        if (!!params.festivalId) {
            return baseQuery.where(tEvents.eventFestivalId.equals(params.festivalId))
                .executeSelectNoneOrOne();
        }

        return baseQuery.where(tEvents.eventFestivalId.isNotNull())
            .and(tEvents.eventEndTime.greaterOrEquals(db.currentDateTime()))
            .and(tEvents.eventHidden.equals(/* false= */ 0))
            .executeSelectNoneOrOne();
    }
}

/**
 * Interface describing the database representation of a stored activity on our end. Driven by the
 * implementation as opposed to being an explicit definition.
 */
export type StoredActivity =
    Awaited<ReturnType<ImportActivitiesTask['fetchActivitiesFromDatabase']>>[number];

/**
 * Type describing an individual stored timeslot.
 */
export type StoredTimeslot = StoredActivity['timeslots'][number];
