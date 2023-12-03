// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Scheduler, TaskIdentifier } from './Scheduler';

/**
 * The task runner is able to execute individual tasks, and maintains detailed logging information
 * on the runtime and success rates. Task runners are strongly associated with a scheduler.
 */
export class TaskRunner {
    #scheduler: Scheduler;

    constructor(scheduler: Scheduler) {
        this.#scheduler = scheduler;
    }

    /**
     * Executes the given `task`. This method will be called in a Next.js context and can access all
     * of the Volunteer Manager infrastructure. Returning the boolean `false` from this method will
     * cause the scheduler to automatically re-schedule this task.
     */
    async executeTask(task: TaskIdentifier): Promise<boolean> {
        if ('taskName' in task)
            return this.executeNamedTask(task.taskName, { /* no params */ });

        // TODO: Fetch the necessary information for `task.taskId` from the database.
        // TODO: Call `executeNamedTask` once the associated task name has been identified.
        return true;
    }

    /**
     * Executes the named `taskName` with the given `params`. The task will be obtained from the
     * TaskRegistry, from which the given `params` will be validated.
     */
    async executeNamedTask(taskName: string, params: object): Promise<boolean> {
        // TODO: Validate the `params` specific to the `taskName`
        // TODO: Actually invoke the `taskName`
        return true;
    }
}
