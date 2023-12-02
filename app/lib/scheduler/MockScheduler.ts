// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Scheduler } from './Scheduler';
import { SchedulerTaskRunner } from './SchedulerTaskRunner';

/**
 * Mock implementation of the scheduler which is to be used in testing environments. Provides access
 * to historic invocations and use that allows it to be introspected.
 */
export class MockScheduler implements Scheduler {
    #executionCount: bigint;
    #invocationCount: bigint;
    #lastExecution?: bigint;
    #lastInvocation?: bigint;

    #taskRunner: SchedulerTaskRunner;

    constructor() {
        this.#executionCount = 0n;
        this.#invocationCount = 0n;
        this.#lastExecution = undefined;
        this.#lastInvocation = undefined;

        this.#taskRunner = new SchedulerTaskRunner(this);
    }

    get executionCount() { return this.#executionCount; }
    get invocationCount() { return this.#invocationCount; }
    get lastExecution() { return this.#lastExecution; }
    get lastInvocation() { return this.#lastInvocation; }
    get taskRunner() { return this.#taskRunner; }

    async execute(): Promise<void> {
        this.#executionCount++;
    }

    async invoke(task: { taskId: number; } | { taskName: string; }): Promise<void> {

    }
}
