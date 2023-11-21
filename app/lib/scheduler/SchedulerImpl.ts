// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Scheduler } from './Scheduler';
import { SchedulerRunner } from './SchedulerRunner';
import { SchedulerTaskRunner } from './SchedulerTaskRunner';

/**
 * Endpoint at which the scheduler frontend can be reached.
 */
const kSchedulerEndpoint =
    `http://${process.env.HOSTNAME || '127.0.0.1'}:${process.env.PORT || '3001'}/api/scheduler`;

/**
 * The scheduler password used for this build of the Volunteer Manager API.
 */
const kSchedulerPassword = process.env.APP_SCHEDULER_PASSWORD;

/**
 * Implementation of the Scheduler type, the actual scheduler used by the Volunteer Manager. This
 * class encapsulates the functionality required to run functionality at a particular interval.
 */
class SchedulerImpl implements Scheduler {
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

        SchedulerRunner.getInstance().attachScheduler(this);
    }

    get executionCount() { return this.#executionCount; }
    get invocationCount() { return this.#invocationCount; }
    get lastExecution() { return this.#lastExecution; }
    get lastInvocation() { return this.#lastInvocation; }
    get taskRunner() { return this.#taskRunner; }

    /**
     * Executes a single round of the scheduler. Will be called once per second in normal operation,
     * although exceptions thrown by this method will add an exponential back-off (with a ceiling).
     */
    async execute(): Promise<void> {
        this.#executionCount++;
        this.#lastExecution = process.hrtime.bigint();
        // TODO: Implement the scheduler.
    }

    /**
     * Invokes the singular task identified by the given `taskId`. This is done by issuing a fetch
     * to a Next.js-backed API for consistency with the rest of the Volunteer Manager.
     */
    async invoke(task: { taskId: number } | { taskName: string }): Promise<void> {
        await fetch(kSchedulerEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                password: kSchedulerPassword,
                ...task,
            }),
        });
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
