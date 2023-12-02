// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type ICompare, PriorityQueue } from '@datastructures-js/priority-queue';

import type { Scheduler, TaskIdentifier } from './Scheduler';
import { SchedulerTaskRunner } from './SchedulerTaskRunner';

/**
 * Information stored for a task that's due to be invoked at a particular time.
 */
interface QueuedTask {
    /**
     * The time, as returned by `process.hrtime.bigint()` (thus monotonically increasing), at which
     * the task should be invoked.
     */
    runtime: bigint;

    /**
     * The task that should be invoked at the configured `runtime`.
     */
    task: TaskIdentifier;
}

/**
 * Comparator that can be used to compare two queued tasks. The task that will be executed soonest
 * will be sorted at the top of the priority queue, everything else will follow thereafter.
 */
const QueuedTaskComparator: ICompare<QueuedTask> = (lhs: QueuedTask, rhs: QueuedTask) => {
    return rhs.runtime > lhs.runtime ? -1 : 1;
};

/**
 * Base implementation of the Scheduler type to be shared between the production and a mock.
 */
export abstract class SchedulerBase implements Scheduler {
    #executionCount: bigint;
    #invocationCount: bigint;
    #lastExecution?: bigint;
    #lastInvocation?: bigint;

    #taskQueue: PriorityQueue<QueuedTask>;
    #taskRunner: SchedulerTaskRunner;

    constructor() {
        this.#executionCount = 0n;
        this.#invocationCount = 0n;
        this.#lastExecution = undefined;
        this.#lastInvocation = undefined;

        this.#taskQueue = new PriorityQueue(QueuedTaskComparator);
        this.#taskRunner = new SchedulerTaskRunner(this);
    }

    get executionCount() { return this.#executionCount; }
    get invocationCount() { return this.#invocationCount; }
    get lastExecution() { return this.#lastExecution; }
    get lastInvocation() { return this.#lastInvocation; }
    get taskRunner() { return this.#taskRunner; }

    /**
     * Queues the given `task` to be executed by the scheduler after the given `delayMs`, which is
     * given in milliseconds. Returns immediately. May be executed from a NextJS environment.
     */
    queueTask(task: TaskIdentifier, delayMs: number) {
        const currentTimeNs = process.hrtime.bigint();
        const delayNs = BigInt(delayMs) * 1000n * 1000n;

        this.#taskQueue.push({
            runtime: currentTimeNs + delayNs,
            task,
        });
    }

    /**
     * Executes a single round of the scheduler. Will be called once per second in normal operation,
     * although exceptions thrown by this method will add an exponential back-off (with a ceiling).
     */
    async execute(): Promise<void> {
        this.#executionCount++;
        this.#lastExecution = process.hrtime.bigint();

        if (!this.#taskQueue.size())
            return;  // the task queue is empty

        const currentTimeNs = process.hrtime.bigint();

        const pendingTask = this.#taskQueue.front();
        if (pendingTask.runtime > currentTimeNs)
            return;  // the task is not ready to be invoked yet

        this.#taskQueue.dequeue();
        {
            this.#invocationCount++;
            this.#lastInvocation = process.hrtime.bigint();

            await this.invoke(pendingTask.task);
        }
    }

    /**
     * Invokes the singular task identified by the given `task`. Must be implemented by the actual
     * scheduler to run the given `task`.
     */
    abstract invoke(task: TaskIdentifier): Promise<void>;
}
