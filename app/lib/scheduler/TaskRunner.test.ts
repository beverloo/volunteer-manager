// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { MockScheduler } from './MockScheduler';
import { TaskResult } from './Task';

describe('TaskRunner', () => {
    it('should be able to execute built-in named tasks', async () => {
        const scheduler = new MockScheduler();

        // (1) Simple tasks
        {
            const result = await scheduler.taskRunner.executeTask({ taskName: 'NoopTask' });
            expect(result).toEqual(TaskResult.TaskSuccess);
        }

        // (2) Complex tasks - failure w/ invalid parameters
        {
            const result = await scheduler.taskRunner.executeTask({ taskName: 'NoopComplexTask' });
            expect(result).toEqual(TaskResult.InvalidParameters);
        }

        // (3) Complex tasks - success due to parameterized behaviour
        {
            const result = await scheduler.taskRunner.executeTask(
                { taskName: 'NoopComplexTask' }, { succeed: true });

            expect(result).toEqual(TaskResult.TaskSuccess);
        }

        // (4) Complex tasks - failure due to parameterized behaviour
        {
            const result = await scheduler.taskRunner.executeTask(
                { taskName: 'NoopComplexTask' }, { succeed: false });

            expect(result).toEqual(TaskResult.TaskFailure);
        }
    });

    it('should reject tasks when they refer to an invalid built-in named task', async () => {
        const scheduler = new MockScheduler();

        const result = await scheduler.taskRunner.executeTask({ taskName: 'InvalidTask' });
        expect(result).toEqual(TaskResult.InvalidNamedTask);

        // TODO: Replicate this test for ID-based task execution.
    });

    it('should validate the parameters for a task ahead of executing it', async () => {
        const scheduler = new MockScheduler();

        const result = await scheduler.taskRunner.executeTask(
            { taskName: 'NoopComplexTask' }, { succeed: 12345678 });

        expect(result).toEqual(TaskResult.InvalidParameters);

        // TODO: Replicate this test for ID-based task execution.
    });

    it('should be able to automatically reschedule repeating tasks', async () => {
        // TODO: Implement this test.
    });

    it('should reject tasks when the given taskId is not known to the database', async () => {
        // TODO: Implement this test.
    });

    it('should reject tasks when the given taskId already has been executed', async () => {
        // TODO: Implement this test.
    });

    it('should log task execution result status and timing to the database', async () => {
        // TODO: Implement this test.
    });
});
