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
        expect(task.log.entries[0].message).toInclude('no upcoming events');

        expect(task.contextForTesting.intervalMsForTesting).toBe(
            ImportActivitiesTask.kIntervalNoUpcomingEvents);
    });

    it('should scale the task interval based on duration until the festival', async () => {
        const task = createImportActivitiesTaskForFestival(
            /* no festival= */ undefined, /* skipDb= */ true);

        expect(task.contextForTesting.intervalMsForTesting).toBeUndefined();

        // (1) More than four months
        task.updateTaskIntervalForFestivalDate(dayjs().add(5, 'months').toDate());
        expect(task.contextForTesting.intervalMsForTesting).toBe(
            ImportActivitiesTask.kIntervalDefault);

        // (2) More than two months
        task.updateTaskIntervalForFestivalDate(dayjs().add(3, 'months').toDate());
        expect(task.contextForTesting.intervalMsForTesting).toBe(
            ImportActivitiesTask.kIntervalFinalFourMonths);

        // (3) More than one month
        task.updateTaskIntervalForFestivalDate(dayjs().add(35, 'days').toDate());
        expect(task.contextForTesting.intervalMsForTesting).toBe(
            ImportActivitiesTask.kIntervalFinalTwoMonths);

        // (4) More than two weeks
        task.updateTaskIntervalForFestivalDate(dayjs().add(15, 'days').toDate());
        expect(task.contextForTesting.intervalMsForTesting).toBe(
            ImportActivitiesTask.kIntervalFinalMonth);

        // (5) Less than (or equal to) two weeks
        task.updateTaskIntervalForFestivalDate(dayjs().add(7, 'days').toDate());
        expect(task.contextForTesting.intervalMsForTesting).toBe(
            ImportActivitiesTask.kIntervalFinalTwoWeeks);

        // (6) Event in the past (possible due to timezone stuff)
        task.updateTaskIntervalForFestivalDate(dayjs().subtract(1, 'day').toDate());
        expect(task.contextForTesting.intervalMsForTesting).toBe(
            ImportActivitiesTask.kIntervalNoUpcomingEvents);
    });
});
