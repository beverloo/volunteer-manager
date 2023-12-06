// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { ZodError } from 'zod';

import type { Scheduler, TaskIdentifier } from './Scheduler';
import { TaskResult } from './Task';
import { kTaskRegistry } from './TaskRegistry';

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
    async executeTask(task: TaskIdentifier, params?: unknown): Promise<TaskResult> {
        if ('taskName' in task)
            return this.executeNamedTask(task.taskName, params);

        // TODO: Fetch the necessary information for `task.taskId` from the database.
        // TODO: Call `executeNamedTask` once the associated task name has been identified.
        return TaskResult.UnknownFailure;
    }

    /**
     * Executes the named `taskName` with the given `params`. The task will be obtained from the
     * TaskRegistry, from which the given `params` will be validated.
     */
    async executeNamedTask(taskName: string, params: unknown): Promise<TaskResult> {
        if (!Object.hasOwn(kTaskRegistry, taskName))
            return TaskResult.InvalidNamedTask;

        try {
            const taskConstructor = kTaskRegistry[taskName as keyof typeof kTaskRegistry];
            const task = new taskConstructor();

            let result: boolean | undefined;
            if (task.isSimpleTask()) {
                result = await task.execute();
            } else if (task.isComplexTask()) {
                const validatedParams = task.validate(params);
                result = await task.execute(validatedParams);
            } else {
                return TaskResult.UnknownFailure;
            }

            return result ? TaskResult.TaskSuccess
                          : TaskResult.TaskFailure;

        } catch (error: any) {
            if (error instanceof ZodError)
                return TaskResult.InvalidParameters;

            // TODO: Proper error handling.
            return TaskResult.TaskException;
        }
    }
}
