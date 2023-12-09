// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { MockScheduler } from './MockScheduler';
import { TaskResult } from './Task';
import { TaskRunner } from './TaskRunner';
import { useMockConnection } from '@lib/database/Connection';

describe('TaskRunner', () => {
    const mockConnection = useMockConnection();

    interface InstallTaskContextOptions {
        taskName: string;
        params?: unknown;
        interval?: number;
    }

    function installTaskContext(taskId: number, options?: InstallTaskContextOptions) {
        mockConnection.expect('selectOneRow', (query: string, params: any[]) => {
            expect(params).toHaveLength(1);
            expect(params[0]).toEqual(taskId);
            if (!options)
                return undefined;

            return {
                taskName: options.taskName,
                params: JSON.stringify(options.params ?? { /* no parameters */ }),
                interval: options.interval ?? null,
            };
        });
    }

    it('should be able to execute built-in named tasks', async () => {
        const taskRunner = TaskRunner.getOrCreateForScheduler(new MockScheduler);

        // (1) Simple tasks
        {
            const result = await taskRunner.executeTask({ taskName: 'NoopTask' });
            expect(result).toEqual(TaskResult.TaskSuccess);
        }

        // (2) Complex tasks - failure w/ invalid parameters
        {
            const result = await taskRunner.executeTask({ taskName: 'NoopComplexTask' });
            expect(result).toEqual(TaskResult.InvalidParameters);
        }

        // (3) Complex tasks - success due to parameterized behaviour
        {
            const result = await taskRunner.executeTask(
                { taskName: 'NoopComplexTask' }, { succeed: true });

            expect(result).toEqual(TaskResult.TaskSuccess);
        }

        // (4) Complex tasks - failure due to parameterized behaviour
        {
            const result = await taskRunner.executeTask(
                { taskName: 'NoopComplexTask' }, { succeed: false });

            expect(result).toEqual(TaskResult.TaskFailure);
        }
    });

    it('should reject tasks when they refer to an invalid built-in named task', async () => {
        const taskRunner = TaskRunner.getOrCreateForScheduler(new MockScheduler);

        // (1) Executing a task using named execution.
        {
            const result = await taskRunner.executeTask({ taskName: 'InvalidTask' });
            expect(result).toEqual(TaskResult.InvalidNamedTask);
        }

        // (2) Executing a task using static database-driven execution.
        {
            installTaskContext(42, { taskName: 'InvalidTask' });

            const result = await taskRunner.executeTask({ taskId: 42 });
            expect(result).toEqual(TaskResult.InvalidNamedTask);
        }
    });

    it('should validate the parameters for a task ahead of executing it', async () => {
        const taskRunner = TaskRunner.getOrCreateForScheduler(new MockScheduler);

        // (1) Executing a task using named execution.
        {
            const result = await taskRunner.executeTask(
                { taskName: 'NoopComplexTask' }, { succeed: 12345678 });

            expect(result).toEqual(TaskResult.InvalidParameters);
        }

        // (2) Executing a task using static database-driven execution.
        {
            installTaskContext(100, {
                taskName: 'NoopComplexTask',
                params: { succeed: 12345678 },
            });

            const result = await taskRunner.executeTask({ taskId: 100 });
            expect(result).toEqual(TaskResult.InvalidParameters);
        }
    });

    it('should be able to automatically reschedule repeating tasks', async () => {
        // TODO: Implement this test.
    });

    it('should reject tasks when the given taskId is not known to the database', async () => {
        const taskRunner = TaskRunner.getOrCreateForScheduler(new MockScheduler);

        installTaskContext(100, /* not found= */ undefined);
        installTaskContext(101, { taskName: 'NoopTask' });
        installTaskContext(102, { taskName: 'NoopComplexTask', params: { succeed: false } });

        const invalidResult = await taskRunner.executeTask({ taskId: 100 });
        expect(invalidResult).toEqual(TaskResult.InvalidTaskId);

        const validResult = await taskRunner.executeTask({ taskId: 101 });
        expect(validResult).toEqual(TaskResult.TaskSuccess);

        const validFailure = await taskRunner.executeTask({ taskId: 102 });
        expect(validFailure).toEqual(TaskResult.TaskFailure);
    });

    it('should log task execution result status and timing to the database', async () => {
        // TODO: Implement this test.
    });
});
