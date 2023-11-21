// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

/**
 * Base parameters that have to be supported by a scheduler task.
 */
export interface SchedulerTaskParams {
    /**
     * Unique ID of the task that is being executed, as it exists in the database.
     */
    taskId: number;
}

/**
 * Interface that describes an implementation of a scheduler task.
 */
export type SchedulerTaskFn = <Params extends SchedulerTaskParams>(params: Params) => Promise<any>;
