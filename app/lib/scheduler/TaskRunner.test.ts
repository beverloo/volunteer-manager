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
        parentTaskId?: number;
        intervalMs?: number;
    }

    function installTaskContext(taskId: number, options?: InstallTaskContextOptions) {
        mockConnection.expect('selectOneRow', (query, params) => {
            expect(params).toHaveLength(1);
            expect(params[0]).toEqual(taskId);
            if (!options)
                return undefined;

            return {
                taskId,
                taskName: options.taskName,
                params: JSON.stringify(options.params ?? { /* no parameters */ }),
                parentTaskId: options.parentTaskId,
                intervalMs: options.intervalMs ?? null,
            };
        });
    }

    interface TaskUpdateResult {
        taskId: number;
        taskInvocationResult: TaskResult;
        taskInvocationLogs: string;
        taskInvocationTimeMs: number;
    }

    interface TaskUpdateWithScheduleResult extends TaskUpdateResult {
        scheduledTaskName: string;
        scheduledTaskParams: string;
        scheduledTaskIntervalMs: number;
    }

    function expectTaskUpdate(expectSchedule: true): Promise<TaskUpdateWithScheduleResult>;
    function expectTaskUpdate(expectSchedule: false): Promise<TaskUpdateResult>;
    function expectTaskUpdate(expectSchedule: boolean) {
        return new Promise(resolve => {
            let updateResult: TaskUpdateResult;

            mockConnection.expect('beginTransaction');
            mockConnection.expect('update', (query, params) => {
                expect(params).toHaveLength(4);
                updateResult = {
                    taskId: params[3],
                    taskInvocationResult: params[0],
                    taskInvocationLogs: params[1],
                    taskInvocationTimeMs: params[2],
                };

                if (!expectSchedule)
                    resolve(updateResult);
            });

            if (expectSchedule) {
                mockConnection.expect('insertReturningLastInsertedId', (query, params) => {
                    expect(params).toHaveLength(4);
                    resolve({
                        ...updateResult,
                        scheduledTaskName: params[0],
                        scheduledTaskParams: params[1],
                        scheduledTaskIntervalMs: params[2],
                    });

                    return /* last inserted id= */ 9001;
                });
            }

            mockConnection.expect('commit');
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

            const updatePromise = expectTaskUpdate(/* expectSchedule= */ false);

            const result = await taskRunner.executeTask({ taskId: 42 });
            expect(result).toEqual(TaskResult.InvalidNamedTask);

            const update = await updatePromise;
            expect(update.taskId).toEqual(42);
            expect(update.taskInvocationResult).toEqual(TaskResult.InvalidNamedTask);
            expect(update.taskInvocationLogs).toEqual('[]');
            expect(update.taskInvocationTimeMs).toBeGreaterThan(0);
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

            const updatePromise = expectTaskUpdate(/* expectSchedule= */ false);

            const result = await taskRunner.executeTask({ taskId: 100 });
            expect(result).toEqual(TaskResult.InvalidParameters);

            const update = await updatePromise;
            expect(update.taskId).toEqual(100);
            expect(update.taskInvocationResult).toEqual(TaskResult.InvalidParameters);
            expect(update.taskInvocationLogs).toEqual('[]');
            expect(update.taskInvocationTimeMs).toBeGreaterThan(0);
        }
    });

    it('should be able to automatically reschedule repeating tasks', async () => {
        const scheduler = new MockScheduler;
        const taskRunner = TaskRunner.getOrCreateForScheduler(scheduler);

        expect(scheduler.taskQueueSize).toEqual(0);

        installTaskContext(100, {
            taskName: 'NoopComplexTask',
            params: { succeed: true, logs: true },
            intervalMs: 1000,
        });

        const updatePromise = expectTaskUpdate(/* expectSchedule= */ true);

        expect(scheduler.taskQueueSize).toEqual(0);

        const result = await taskRunner.executeTask({ taskId: 100 });
        expect(result).toEqual(TaskResult.TaskSuccess);

        expect(scheduler.taskQueueSize).toEqual(1);

        const update = await updatePromise;
        expect(update.taskId).toEqual(100);
        expect(update.taskInvocationResult).toEqual(TaskResult.TaskSuccess);
        expect(update.taskInvocationTimeMs).toBeGreaterThan(0);
        expect(update.scheduledTaskName).toEqual('NoopComplexTask');
        expect(update.scheduledTaskParams).toEqual('{"succeed":true,"logs":true}');
        expect(update.scheduledTaskIntervalMs).toEqual(1000);

        const logs = JSON.parse(update.taskInvocationLogs);
        expect(logs).toHaveLength(1);

        expect(logs[0].severity).toEqual('Info');
        expect(logs[0].time).toBeGreaterThan(0);
        expect(logs[0].message).toEqual('Parameters=');
        expect(logs[0].data).toEqual([ { succeed: true, logs: true } ]);
    });

    it('should be able to have tasks modify their interval if they so desire', async () => {
        const taskRunner = TaskRunner.getOrCreateForScheduler(new MockScheduler);

        installTaskContext(100, {
            taskName: 'NoopComplexTask',
            params: { succeed: true, intervalMs: 60000 },
            intervalMs: 120000,
        });

        const updatePromise = expectTaskUpdate(/* expectSchedule= */ true);
        const result = await taskRunner.executeTask({ taskId: 100 });
        expect(result).toEqual(TaskResult.TaskSuccess);

        const update = await updatePromise;
        expect(update.taskId).toEqual(100);
        expect(update.taskInvocationResult).toEqual(TaskResult.TaskSuccess);
        expect(update.scheduledTaskName).toEqual('NoopComplexTask');
        expect(update.scheduledTaskParams).toEqual('{"succeed":true,"intervalMs":60000}');
        expect(update.scheduledTaskIntervalMs).toEqual(60000);
    });

    it('should be able to have tasks cancel their repetition if they so desire', async () => {
        const taskRunner = TaskRunner.getOrCreateForScheduler(new MockScheduler);

        installTaskContext(100, {
            taskName: 'NoopComplexTask',
            params: { succeed: true, intervalMs: /* cancel= */ null },
            intervalMs: 120000,
        });

        const updatePromise = expectTaskUpdate(/* expectSchedule= */ false);
        const result = await taskRunner.executeTask({ taskId: 100 });
        expect(result).toEqual(TaskResult.TaskSuccess);

        const update = await updatePromise;
        expect(update.taskId).toEqual(100);
        expect(update.taskInvocationResult).toEqual(TaskResult.TaskSuccess);
        expect(Object.hasOwn(update, 'scheduledTaskName')).toBeFalse();
        expect(Object.hasOwn(update, 'scheduledTaskParams')).toBeFalse();
        expect(Object.hasOwn(update, 'scheduledTaskIntervalMs')).toBeFalse();
    });

    it('should always ignore intervals for repeated tasks', async () => {
        const taskRunner = TaskRunner.getOrCreateForScheduler(new MockScheduler);

        installTaskContext(100, {
            taskName: 'NoopComplexTask',
            params: { succeed: true },
            parentTaskId: 12,
            intervalMs: 120000,
        });

        const updatePromise = expectTaskUpdate(/* expectSchedule= */ false);
        const result = await taskRunner.executeTask({ taskId: 100 });
        expect(result).toEqual(TaskResult.TaskSuccess);

        const update = await updatePromise;
        expect(update.taskId).toEqual(100);
        expect(update.taskInvocationResult).toEqual(TaskResult.TaskSuccess);
        expect(Object.hasOwn(update, 'scheduledTaskName')).toBeFalse();
        expect(Object.hasOwn(update, 'scheduledTaskParams')).toBeFalse();
        expect(Object.hasOwn(update, 'scheduledTaskIntervalMs')).toBeFalse();

        expect(update.taskInvocationLogs).toInclude(
            'Task was manually repeated, ignoring the execution interval');
    });

    it('should reject tasks when the given taskId is not known to the database', async () => {
        const taskRunner = TaskRunner.getOrCreateForScheduler(new MockScheduler);

        installTaskContext(100, /* not found= */ undefined);

        const invalidResult = await taskRunner.executeTask({ taskId: 100 });
        expect(invalidResult).toEqual(TaskResult.InvalidTaskId);

        installTaskContext(101, { taskName: 'NoopTask' });

        const validResultUpdatePromise = expectTaskUpdate(/* expectSchedule= */ false);
        const validResult = await taskRunner.executeTask({ taskId: 101 });
        expect(validResult).toEqual(TaskResult.TaskSuccess);

        expect((await validResultUpdatePromise).taskInvocationResult).toEqual(
            TaskResult.TaskSuccess);

        installTaskContext(102, { taskName: 'NoopComplexTask', params: { succeed: false } });

        const validFailureUpdatePromise = expectTaskUpdate(/* expectSchedule= */ false);
        const validFailure = await taskRunner.executeTask({ taskId: 102 });
        expect(validFailure).toEqual(TaskResult.TaskFailure);

        expect((await validFailureUpdatePromise).taskInvocationResult).toEqual(
            TaskResult.TaskFailure);
    });
});
