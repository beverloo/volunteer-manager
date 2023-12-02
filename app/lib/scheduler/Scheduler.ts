// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { SchedulerTaskRunner } from './SchedulerTaskRunner';

/**
 * Unique identifier for a task that is to be executed by the scheduler.
 */
export type TaskIdentifier = { taskId: number } | { taskName: string };

/**
 * Interface that describes the methods that must be available on a Scheduler implementation.
 */
export interface Scheduler {
    /**
     * Returns the number of times that the scheduler has been executed.
     */
    get executionCount(): bigint;

    /**
     * Returns the number of invocations that the scheduler made to running actual jobs.
     */
    get invocationCount(): bigint;

    /**
     * Returns the monotonically increasing high-resolution timestamp at which the scheduler was
     * last executed. `undefined` signals that the scheduler has never been executed yet.
     */
    get lastExecution(): bigint | undefined;

    /**
     * Returns the monotonically increasing high-resolution timestamp at which the scheduler last
     * invocated a task. `undefined` signals that no task has been executed yet.
     */
    get lastInvocation(): bigint | undefined;

    /**
     * Returns the task runner that has been created for this scheduler instance.
     */
    get taskRunner(): SchedulerTaskRunner;

    /**
     * Executes the scheduler and flushes all pending tasks. Any new tasks issued while execution is
     * in progress will be saved for a future invocation.
     */
    execute(): Promise<void>;

    /**
     * Invokes the task identified by the given `task`. This will issue a call to the execution API
     * to bring us back to the Next.js environment the Volunteer Manager runs in.
     */
    invoke(task: TaskIdentifier): Promise<void>;

    /**
     * Queues the given `task` to be executed by the scheduler after the given `delay`, which is
     * given in milliseconds. Returns immediately. May be executed from a NextJS environment.
     */
    queueTask(task: TaskIdentifier, delayMs: number): void;
}
