// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Activity, Floor, Location, Timeslot } from '@lib/integrations/animecon';
import { ImportActivitiesTask, type StoredActivity } from './ImportActivitiesTask';
import { TaskContext } from '../TaskContext';
import { dayjs } from '@lib/DateTime';
import { useMockConnection } from '@lib/database/Connection';

type PartialWithRequiredId<T> = Partial<T> & { id: number};

describe('ImportActivitiesTask', () => {
    const mockConnection = useMockConnection();

    type PartialStoredActivity = PartialWithRequiredId<Omit<StoredActivity, 'id' | 'timeslots'>>;
    type PartialStoredTimeslot =
        PartialWithRequiredId<Omit<StoredActivity['timeslots'][number], 'id'>>;

    function createStoredActivity(
        activity: PartialStoredActivity, timeslots: PartialStoredTimeslot[]): StoredActivity
    {
        return {
            created: new Date('2023-12-23 12:00:00'),
            updated: new Date('2023-12-23 12:00:00'),
            deleted: undefined,

            title: 'Example activity',
            description: undefined,
            url: undefined,
            price: undefined,
            maxVisitors: undefined,
            visible: 1,
            visibleReason: undefined,

            type: {
                adultsOnly: 0,
                competition: 0,
                cosplay: 0,
                event: 0,
                gameRoom: 0,
                video: 0,
            },

            timeslots: timeslots.map(timeslot => ({
                startTime: new Date('2024-06-09 15:00:00'),
                endTime: new Date('2024-06-09 15:30:00'),
                locationId: 100,
                locationName: 'Example location',

                ...timeslot,
            })),

            ...activity,
        };
    }

    function createSimpleFloor(floor: PartialWithRequiredId<Floor>): Floor {
        return {
            year: 2024,
            name: 'Example floor',
            description: null,
            cssBackgroundColor: null,
            ...floor,
        };
    }

    function createSimpleLocation(location: PartialWithRequiredId<Location>): Location {
        return {
            year: 2024,
            name: 'Example location',
            useName: null,
            sponsor: null,
            floor: createSimpleFloor({ id: 10 }),
            ...location,
        };
    }

    function createSimpleTimeslot(timeslot: PartialWithRequiredId<Timeslot>): Timeslot {
        return {
            dateStartsAt: '2024-06-09 10:00:00',
            dateEndsAt: '2024-06-09 10:30:00',
            location: createSimpleLocation({ id: 100 }),
            ...timeslot,
        };
    }

    function createSimpleActivity(activity: PartialWithRequiredId<Activity>): Activity {
        return {
            year: '2024',
            festivalId: 101,
            title: 'Example activity',
            sponsor: null,
            visible: true,
            reasonInvisible: null,
            spellChecked: true,
            maxVisitors: null,
            price: null,
            rules: null,
            description: null,
            printDescription: null,
            webDescription: null,
            socialDescription: null,
            url: null,
            prizes: null,
            techInfo: /* accessible but empty= */ null,
            logisticsInfo: /* accessible but empty= */ null,
            financeInfo: /* accessible but empty= */ null,
            ticketsInfo: /* accessible but empty= */ null,
            largeImage: null,
            smallImage: null,
            activityType: null, // ...
            timeslots: [ createSimpleTimeslot({ id: 1000 + activity.id }) ],
            ...activity,
        };
    }

    interface FestivalOptions {
        festivalEndTime: Date;
        festivalId: number;
        activities?: Activity[];
        storedActivities?: StoredActivity[];
    }

    function createImportActivitiesTaskForFestival(options?: FestivalOptions, skipDb?: boolean) {
        const context = TaskContext.forEphemeralTask('ImportActivitiesTask', { /* no params */ });
        const task = new class extends ImportActivitiesTask {
            constructor() {
                super(context);
            }

            override async fetchActivitiesFromApi(festivalId: number): Promise<Activity[]> {
                return options?.activities ?? [];
            }

            override async fetchActivitiesFromDatabase(festivalId: number)
                : Promise<StoredActivity[]>
            {
                return options?.storedActivities ?? [];
            }
        };

        expect(task.isSimpleTask()).toBeTrue();  // validate params if this fails

        if (!skipDb) {
            mockConnection.expect('selectOneRow', () => {
                if (!options)
                    return undefined;

                return {
                    festivalEndTime: options.festivalEndTime,
                    festivalId: options.festivalId,
                };
            });
        }

        return task;
    }

    it('should skip when there are no upcoming festivals', async () => {
        const task = createImportActivitiesTaskForFestival(/* no festival= */ undefined);
        expect(task.contextForTesting.intervalMsForTesting).toBeUndefined();

        const result = await task.execute();
        expect(result).toBeTrue();

        expect(task.log.entries).toHaveLength(1);
        expect(task.log.entries[0].message).toInclude('No future events');

        expect(task.contextForTesting.intervalMsForTesting).toBe(
            ImportActivitiesTask.kIntervalMaximum);
    });

    it('should skip when no activities were returned from the AnimeCon API', async () => {
        const task = createImportActivitiesTaskForFestival({
            festivalEndTime: dayjs().add(100, 'days').toDate(),
            festivalId: 101,
        });

        const result = await task.execute();
        expect(result).toBeTrue();

        expect(task.log.entries).toHaveLength(2);
        expect(task.log.entries[0].message).toInclude('Interval');
        expect(task.log.entries[1].message).toInclude('No activities were returned');
    });

    it('should scale the task interval based on duration until the festival', async () => {
        const task = createImportActivitiesTaskForFestival(
            /* no festival= */ undefined, /* skipDb= */ true);

        expect(task.contextForTesting.intervalMsForTesting).toBeUndefined();

        // Confirm that the configured intervals will be applied as expected.
        for (const { maximumDays, intervalMs } of ImportActivitiesTask.kIntervalConfiguration) {
            task.updateTaskIntervalForFestivalDate(dayjs().add(maximumDays, 'days').toDate());
            expect(task.contextForTesting.intervalMsForTesting).toBe(intervalMs);
        }

        // Confirm that events that won't happen for at least 9 months won't update frequently.
        task.updateTaskIntervalForFestivalDate(dayjs().add(1, 'year').toDate());
        expect(task.contextForTesting.intervalMsForTesting).toBe(
            ImportActivitiesTask.kIntervalMaximum);

        // Confirm that events that have already happened won't update frequently.
        task.updateTaskIntervalForFestivalDate(dayjs().subtract(1, 'day').toDate());
        expect(task.contextForTesting.intervalMsForTesting).toBe(
            ImportActivitiesTask.kIntervalMaximum);
    });

    it('should be able to identify additions to the program', () => {
        const task = createImportActivitiesTaskForFestival(
            /* no festival= */ undefined, /* skipDb= */ true);

        const mutations = task.compareActivities([
            createSimpleActivity({ id: 100 }),
            createSimpleActivity({ id: 101 })
        ], [
            createStoredActivity({ id: 100 }, [ /* no timeslots */ ]),
            // Note: ID `101` is missing
        ]);

        expect(mutations.created).toHaveLength(1);
        expect(mutations.updated).toHaveLength(0);
        expect(mutations.deleted).toHaveLength(0);

        expect(mutations.mutations).toHaveLength(1);
        expect(mutations.mutations[0]).toEqual({
            activityId: 101,
            mutation: 'Created',
            severity: 'Moderate',
        });
    });

    it('should be able to identify additions to timeslots in the program', () => {
        // TODO: Implement me.
    });

    it('should be able to identify updates to the program', () => {
        // TODO: Implement me.
    });

    it('should be able to identify updates to timeslots in the program', () => {
        // TODO: Implement me.
    });

    it('should be able to identify removals from the program', () => {
        const task = createImportActivitiesTaskForFestival(
            /* no festival= */ undefined, /* skipDb= */ true);

        const mutations = task.compareActivities([
            createSimpleActivity({ id: 100 }),
            // Note: ID `101` is missing
        ], [
            createStoredActivity({ id: 100 }, [ /* no timeslots */ ]),
            createStoredActivity({ id: 101 }, [ /* no timeslots */ ]),
        ]);

        expect(mutations.created).toHaveLength(0);
        expect(mutations.updated).toHaveLength(0);
        expect(mutations.deleted).toHaveLength(1);

        expect(mutations.mutations).toHaveLength(1);
        expect(mutations.mutations[0]).toEqual({
            activityId: 101,
            mutation: 'Deleted',
            severity: 'Moderate',
        });
    });

    it('should be able to identify removed timeslots from the program', () => {
        // TODO: Implement me.
    });

    it('should be able to run the task end-to-end with various mutations', async () => {
        // TODO: Implement me.
    });
});
