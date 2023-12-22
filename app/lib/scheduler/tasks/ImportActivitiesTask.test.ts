// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Activity } from '@lib/integrations/animecon';
import { ImportActivitiesTask, type StoredActivity } from './ImportActivitiesTask';
import { TaskContext } from '../TaskContext';
import { dayjs } from '@lib/DateTime';
import { useMockConnection } from '@lib/database/Connection';

describe('ImportActivitiesTask', () => {
    const mockConnection = useMockConnection();

    type PartialStoredActivity = Partial<Omit<StoredActivity, 'id' | 'timeslots'>> & { id: number };
    type PartialStoredTimeslot =
        Partial<Omit<StoredActivity['timeslots'][number], 'id'>> & { id: number };

    function createStoredActivity(
        activity: PartialStoredActivity, timeslots: PartialStoredTimeslot[]): StoredActivity
    {
        return {
            created: new Date(),
            updated: new Date(),
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
                startTime: new Date(),
                endTime: new Date(),
                locationId: 100,
                locationName: 'Example location',

                ...timeslot,
            })),

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
});
