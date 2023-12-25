// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { ExecutableInsert } from 'ts-sql-query/expressions/insert';
import type { ExecutableUpdate } from 'ts-sql-query/expressions/update';
import symmetricDifference from 'set.prototype.symmetricdifference';
import { z } from 'zod';

import type { Activity, Location, Timeslot } from '@lib/integrations/animecon';
import { ActivityType } from '@lib/database/Types';
import { TaskWithParams } from '../Task';
import { createAnimeConClient } from '@lib/integrations/animecon';
import { dayjs } from '@lib/DateTime';
import db, { tActivities, tActivitiesLocations, tActivitiesTimeslots, tEvents }
    from '@lib/database';

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
 * What are the table definitions in which mutations can be made by this task?
 */
type MutationTableTypes =
    typeof tActivities | typeof tActivitiesLocations | typeof tActivitiesTimeslots;

/**
 * Severities that can be assigned to an individual mutation.
 */
type MutationSeverity = 'Low' | 'Moderate' | 'Important';

/**
 * Mutations are expressed as a set of queries (created by the `compareActivities` method) together
 * with a list of changes. The list deliberately is inspectable to enable testing.
 */
interface Mutations {
    created: ExecutableInsert<MutationTableTypes>[],
    updated: ExecutableUpdate<MutationTableTypes>[],
    deleted: ExecutableUpdate<MutationTableTypes>[],
    mutations: {
        activityId?: number;
        activityTimeslotId?: number;
        locationId?: number;

        mutation: 'Created' | 'Updated' | 'Deleted';
        mutatedFields?: string[];
        severity: MutationSeverity;
    }[];
}

/**
 * Type describing an individual stored location.
 */
export interface StoredLocation {
    id: number;
    name: string;
}

/**
 * Type describing what has updated, if anything. The `fields` may be empty if no updates happened.
 */
type UpdateInfo = { fields: string[], severity: MutationSeverity; };

/**
 * Type describing the comparison for an individual field between the stored and current values.
 */
type UpdateField = { name: string; weight: number; } &
    (
        { stored: number; current: boolean } |
        { stored: number; current: number } |
        { stored: string; current: string }
    );

/**
 * Severity levels that can be assigned to updates of individual fields. Used to determine the
 * severity of the overall mutation.
 */
const kUpdateSeverityLevel = {
    Low: 1,
    Moderate: 10,
    Important: 100,
};

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
        const seenLocationsInStoredProgram = new Map<number, StoredLocation>();
        const seenTimeslotsInStoredProgram = new Map<number, StoredTimeslot>();

        const timeslotToStoredActivity = new Map<number, StoredActivity>();

        for (const storedActivity of storedActivities) {
            seenActivitiesInStoredProgram.set(storedActivity.id, storedActivity);
            for (const storedTimeslot of storedActivity.timeslots) {
                seenTimeslotsInStoredProgram.set(storedTimeslot.id, storedTimeslot);
                timeslotToStoredActivity.set(storedTimeslot.id, storedActivity);

                if (!seenLocationsInStoredProgram.has(storedTimeslot.locationId)) {
                    seenLocationsInStoredProgram.set(storedTimeslot.locationId, {
                        id: storedTimeslot.locationId,
                        name: storedTimeslot.locationName,
                    });
                }
            }
        }

        // -----------------------------------------------------------------------------------------
        // Step 2: Gather IDs of entities in the current program
        // -----------------------------------------------------------------------------------------

        const seenActivitiesInCurrentProgram = new Map<number, Activity>();
        const seenLocationsInCurrentProgram = new Map<number, Location>();
        const seenTimeslotsInCurrentProgram = new Map<number, Timeslot>();

        const timeslotToCurrentActivity = new Map<number, Activity>();

        for (const currentActivity of currentActivities) {
            seenActivitiesInCurrentProgram.set(currentActivity.id, currentActivity);
            for (const currentTimeslot of currentActivity.timeslots) {
                seenTimeslotsInCurrentProgram.set(currentTimeslot.id, currentTimeslot);
                timeslotToCurrentActivity.set(currentTimeslot.id, currentActivity);

                if (!seenLocationsInCurrentProgram.has(currentTimeslot.location.id)) {
                    seenLocationsInCurrentProgram.set(
                        currentTimeslot.location.id, currentTimeslot.location);
                }
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
                        activityDeleted: null,
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

        // -----------------------------------------------------------------------------------------

        const addedOrRemovedLocations = symmetricDifference(
            new Set([ ...seenLocationsInStoredProgram.keys() ]),
            new Set([ ...seenLocationsInCurrentProgram.keys() ]));

        for (const locationId of addedOrRemovedLocations) {
            if (!seenLocationsInStoredProgram.has(locationId)) {
                const currentLocation = seenLocationsInCurrentProgram.get(locationId);
                if (!currentLocation)
                    throw new Error('Unrecognised new entry in seenLocationsInCurrentProgram');

                mutations.created.push(dbInstance.insertInto(tActivitiesLocations)
                    .set({
                        locationId: currentLocation.id,
                        locationType: ActivityType.Program,
                        locationName: currentLocation.useName ?? currentLocation.name,
                        locationCreated: dbInstance.currentDateTime(),
                        locationUpdated: dbInstance.currentDateTime(),
                        locationDeleted: null,
                    }));

                mutations.mutations.push({
                    locationId: locationId,
                    mutation: 'Created',
                    severity: 'Moderate',
                });

            } else {
                const storedLocation = seenLocationsInStoredProgram.get(locationId);
                if (!storedLocation)
                    throw new Error('Unrecognised removed entry in seenLocationsInStoredProgram');

                mutations.deleted.push(dbInstance.update(tActivitiesLocations)
                    .set({
                        locationDeleted: dbInstance.currentDateTime(),
                    })
                    .where(tActivitiesLocations.locationId.equals(storedLocation.id)));

                mutations.mutations.push({
                    locationId: locationId,
                    mutation: 'Deleted',
                    severity: 'Moderate',
                });
            }
        }

        // -----------------------------------------------------------------------------------------

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
                        timeslotCreated: dbInstance.currentDateTime(),
                        timeslotUpdated: dbInstance.currentDateTime(),
                        timeslotDeleted: null,
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

        // -----------------------------------------------------------------------------------------
        // Step 4: Identify updates to the program
        // -----------------------------------------------------------------------------------------

        for (const storedActivity of seenActivitiesInStoredProgram.values()) {
            const currentActivity = seenActivitiesInCurrentProgram.get(storedActivity.id);
            if (!currentActivity)
                continue;

            const update = this.compareActivity(storedActivity, currentActivity);
            if (!update.fields.length)
                continue;  // the `storedActivity` is still up-to-date

            // TODO: Update the database representation with `currentActivity`.
        }

        for (const storedLocation of seenLocationsInStoredProgram.values()) {
            const currentLocation = seenLocationsInCurrentProgram.get(storedLocation.id);
            if (!currentLocation)
                continue;

            const update = this.compareLocation(storedLocation, currentLocation);
            if (!update.fields.length)
                continue;  // the `storedLocation` is still up-to-date

            mutations.updated.push(dbInstance.update(tActivitiesLocations)
                .set({
                    locationName: currentLocation.useName ?? currentLocation.name,
                    locationUpdated: dbInstance.currentDateTime(),
                    locationDeleted: null,
                })
                .where(tActivitiesLocations.locationId.equals(storedLocation.id)));

            mutations.mutations.push({
                locationId: storedLocation.id,
                mutation: 'Updated',
                mutatedFields: update.fields,
                severity: update.severity,
            });
        }

        for (const storedTimeslot of seenTimeslotsInStoredProgram.values()) {
            const currentTimeslot = seenTimeslotsInCurrentProgram.get(storedTimeslot.id);
            if (!currentTimeslot)
                continue;

            const update = this.compareTimeslot(storedTimeslot, currentTimeslot);
            if (!update.fields.length)
                continue;  // the `storedTimeslot` is still up-to-date

            // TODO: Update the database representation with `currentTimeslot`.
        }

        return mutations;
    }

    // ---------------------------------------------------------------------------------------------

    compareActivity(storedActivity: StoredActivity, currentActivity: Activity): UpdateInfo {
        return { fields: [], severity: 'Low' };
    }

    compareLocation(storedLocation: StoredLocation, currentLocation: Location): UpdateInfo {
        return this.compareFields([
            {
                name: 'name',
                weight: kUpdateSeverityLevel.Low,
                stored: storedLocation.name,
                current: currentLocation.useName ?? currentLocation.name,
            }
        ]);
    }

    compareTimeslot(storedTimeslot: StoredTimeslot, currentTimeslot: Timeslot): UpdateInfo {
        return { fields: [], severity: 'Low' };
    }

    // ---------------------------------------------------------------------------------------------

    compareFields(fields: UpdateField[]): UpdateInfo {
        const update = {
            fields: [ /* no fields yet */ ] as string[],
            weight: 0,
        };

        for (const { name, weight, stored, current } of fields) {
            if (this.compareField(stored, current))
                continue;

            update.fields.push(name);
            update.weight += weight;
        }

        return {
            fields: update.fields,
            severity: this.updateWeightToSeverityLevel(update.weight),
        };
    }

    //compareField(storedField: number, currentField: boolean): boolean;
    //compareField(storedField: number, currentField: number): boolean;
    //compareField(storedField: string, currentField: string): boolean;
    compareField(storedField: unknown, currentField: unknown): boolean {
        if (typeof storedField === 'number') {
            if (typeof currentField === 'boolean') {
                return !!storedField === currentField;
            } else if (typeof currentField === 'number') {
                if (Number.isNaN(storedField) && Number.isNaN(currentField))
                    return true;
                return storedField === currentField;
            } else {
                throw new Error(`Unexpected field type in "currentField": ${typeof currentField}`);
            }
        } else if (typeof storedField === 'string') {
            if (typeof currentField === 'string')
                return storedField === currentField;
            else
                throw new Error(`Unexpected field type in "currentField": ${typeof currentField}`);
        } else {
            throw new Error(`Unexpected field type in "storedField": ${typeof storedField}`);
        }
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
            .innerJoin(tActivitiesLocations)
                .on(tActivitiesLocations.locationId.equals(tActivitiesTimeslots.timeslotLocationId))
                .and(tActivitiesLocations.locationType.equals(ActivityType.Program))
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
                    locationName: tActivitiesLocations.locationName,
                }),
            })
            .groupBy(tActivities.activityId)
            .executeSelectMany();
    }

    // ---------------------------------------------------------------------------------------------

    updateWeightToSeverityLevel(weight: number): MutationSeverity {
        if (weight < kUpdateSeverityLevel.Moderate)
            return 'Low';
        else if (weight < kUpdateSeverityLevel.Important)
            return 'Moderate';
        else
            return 'Important';
    }

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