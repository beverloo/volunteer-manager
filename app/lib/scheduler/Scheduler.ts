// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

/**
 * Interface that describes the methods that must be available on a Scheduler implementation.
 */
export interface Scheduler {
    /**
     * Returns the number of times that the scheduler has been executed.
     */
    get executionCount(): bigint;

    /**
     * Returns the monotonically increasing high-resolution timestamp at which the scheduler was
     * last executed. `undefined` signals that the scheduler has never been executed yet.
     */
    get lastExecution(): bigint | undefined;

    /**
     * Executes the scheduler and flushes all pending tasks. Any new tasks issued while execution is
     * in progress will be saved for a future invocation.
     */
    execute(): Promise<void>;

    // TODO: queueRepeatingTask
    // TODO: queueTask
}
