// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Scheduler } from './Scheduler';
// NOTE: Do not import further dependencies from here, as this file is used outside of the app
// bundle and we want to minimise side-effects.

/**
 * Maximum exception multiplier. The multiplier will be doubled each time an exception is thrown
 * when executing a scheduler. The maximum walltime is this multiplied by the interval.
 */
const kMaximumExceptionMultiplier = 64;

/**
 * Interval, in milliseconds, at which the schedulers should be invoked.
 */
const kSchedulerRunnerIntervalMs = 1000;

/**
 * Private Symbol preventing direct instantiation of the SchedulerRunner class.
 */
const kSchedulerRunnerPrivateSymbol = Symbol('SchedulerRunner');

/**
 * Global instance of the SchedulerRunner. Will be created by `SchedulerRunner::getInstance()`.
 */
let globalSchedulerRunner: SchedulerRunner | undefined = undefined;

/**
 * Returns a promise that will be resolved after the given number of `ms`. Can be awaited.
 */
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms ?? 8));

/**
 * The SchedulerRunner executes each of the schedulers at a given interval.
 */
export class SchedulerRunner {
    /**
     * Returns the global instance of the Volunteer Manager's Scheduler.
     */
    static getInstance(): SchedulerRunner {
        if (!globalSchedulerRunner)
            globalSchedulerRunner = new SchedulerRunner(kSchedulerRunnerPrivateSymbol);

        return globalSchedulerRunner;
    }

    #abortController?: AbortController;
    #exceptionPenaltyMultiplier: number;
    #schedulers: Set<Scheduler>;

    private constructor(privateSymbol: Symbol) {
        if (privateSymbol !== kSchedulerRunnerPrivateSymbol)
            throw new Error('Do not instantiate the runner directly, use getInstance() instead');

        this.#abortController = undefined;
        this.#exceptionPenaltyMultiplier = 1;
        this.#schedulers = new Set();
    }

    /**
     * Attaches the given `scheduler` to the runner, for further repeated execution.
     */
    attachScheduler(scheduler: Scheduler): void {
        this.#schedulers.add(scheduler);

        // TODO: Queue the task instead so that it doesn't execute when the runner is disabled.
        scheduler.invoke({ taskName: 'PopulateSchedulerTask' });
    }

    /**
     * Detaches the given `scheduler` from the runner, no further invocations will be made.
     */
    detachScheduler(scheduler: Scheduler): void {
        this.#schedulers.delete(scheduler);
    }

    /**
     * Runs each the schedulers in a loop. This method is designed to never return unless the abort
     * signal is issued, which may happen for tests but not in production cases.
     */
    async runLoop() {
        if (!!this.#abortController)
            throw new Error('The Scheduler is already running, cannot start it again');

        this.#abortController = new AbortController();
        while (!this.#abortController.signal.aborted) {
            for (const scheduler of this.#schedulers) {
                try {
                    await scheduler.execute();
                    this.#exceptionPenaltyMultiplier = /* reset= */ 1;
                } catch (error: any) {
                    console.error('[SchedulerRunner] An exception was thrown:', error);
                    if (this.#exceptionPenaltyMultiplier < kMaximumExceptionMultiplier)
                        this.#exceptionPenaltyMultiplier *= 2;
                }
            }

            await wait(this.#exceptionPenaltyMultiplier * kSchedulerRunnerIntervalMs);
        }

        this.#abortController = undefined;
    }
}
