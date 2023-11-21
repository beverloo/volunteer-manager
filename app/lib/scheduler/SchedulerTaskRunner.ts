// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Scheduler } from './Scheduler';

/**
 * The task runner is able to execute individual tasks, and maintains detailed logging information
 * on the runtime and success rates. Task runners are strongly associated with a scheduler.
 */
export class SchedulerTaskRunner {
    #scheduler: Scheduler;

    constructor(scheduler: Scheduler) {
        this.#scheduler = scheduler;
    }

    /**
     * Executes the given `task`, which may either be a task Id or a task name. This method will
     * be called in a Next.js context and can access all of the Volunteer Manager infrastructure.
     */
    async executeTask(task: { taskId: number } | { taskName: string }){
        console.log(task);
    }
}
