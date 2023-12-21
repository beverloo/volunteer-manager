// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { ImportActivitiesTask } from './ImportActivitiesTask';
import { TaskContext } from '../TaskContext';
import { useMockConnection } from '@lib/database/Connection';

describe('ImportActivitiesTask', () => {
    const mockConnection = useMockConnection();

    interface FestivalOptions {
        festivalEndTime: Date;
        festivalId: number;
    }

    function createImportActivitiesTaskForFestival(festival?: FestivalOptions, params?: unknown) {
        const context = TaskContext.forEphemeralTask('ImportActivitiesTask', params);
        const task = new ImportActivitiesTask(context);
        expect(task.isSimpleTask()).toBeTrue();  // validate |params| if this fails

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
});
