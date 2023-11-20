// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Scheduler } from './Scheduler';
import { SchedulerRunner } from './SchedulerRunner';

/**
 * Implementation of the Scheduler type, the actual scheduler used by the Volunteer Manager. This
 * class encapsulates the functionality required to run functionality at a particular interval.
 */
class SchedulerImpl implements Scheduler {
    #executionCount: bigint;
    #lastExecution?: bigint;

    constructor() {
        this.#executionCount = 0n;
        this.#lastExecution = undefined;

        SchedulerRunner.getInstance().attachScheduler(this);
    }

    get executionCount() { return this.#executionCount; }
    get lastExecution() { return this.#lastExecution; }

    /**
     * Executes a single round of the scheduler. Will be called once per second in normal operation,
     * although exceptions thrown by this method will add an exponential back-off (with a ceiling).
     */
    async execute() {
        this.#executionCount++;
        this.#lastExecution = process.hrtime.bigint();
        // TODO: Implement the scheduler.
    }
}

/**
 * Store the scheduler instance on the `globalThis` global, to avoid creating new instances each
 * time this file is reloaded. This provides consistent behaviour in development environments,
 * although the server will have to be restarted when the SchedulerImpl behaviour changes.
 */
declare module globalThis {
    let animeConScheduler: Scheduler;
}

globalThis.animeConScheduler ??= new SchedulerImpl();

/**
 * The global scheduler used by the Volunteer Manager.
 */
export const globalScheduler = globalThis.animeConScheduler;
