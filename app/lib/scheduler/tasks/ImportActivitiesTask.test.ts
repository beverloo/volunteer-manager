// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { ImportActivitiesTask } from './ImportActivitiesTask';
import { TaskContext } from '../TaskContext';
import { dayjs } from '@lib/DateTime';
import { useMockConnection } from '@lib/database/Connection';

describe('ImportActivitiesTask', () => {
    const mockConnection = useMockConnection();

    interface FestivalOptions {
        festivalEndTime: Date;
        festivalId: number;
    }

    function createImportActivitiesTaskForFestival(festival?: FestivalOptions, skipDb?: boolean) {
        const context = TaskContext.forEphemeralTask('ImportActivitiesTask', { /* no params */ });
        const task = new ImportActivitiesTask(context);
        expect(task.isSimpleTask()).toBeTrue();  // validate params if this fails

        if (!skipDb)
            mockConnection.expect('selectOneRow', () => festival);

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
