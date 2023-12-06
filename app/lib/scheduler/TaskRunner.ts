// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { ZodError } from 'zod';

import type { Scheduler, TaskIdentifier } from './Scheduler';
import { TaskContext } from './TaskContext';
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
            return this.executeNamedTask(TaskContext.forEphemeralTask(task.taskName, params));

        const context = await TaskContext.forStaticTask(task.taskId, params);
        if (!context)
            return TaskResult.InvalidTaskId;

        const result = this.executeNamedTask(context);
        // TODO: Write `result` and whatever is known to the `context` to the database. w/ transact
        // TODO: Reschedule the task to be executed again when an interval is known.

        return result;
    }

    /**
     * Executes the task described by the given `context`. Parameters, when given, will be validated
     * against their scheme.
     */
    private async executeNamedTask(context: TaskContext): Promise<TaskResult> {
        if (!Object.hasOwn(kTaskRegistry, context.taskName))
            return TaskResult.InvalidNamedTask;

        try {
            const taskConstructor = kTaskRegistry[context.taskName as keyof typeof kTaskRegistry];
            const task = new taskConstructor();

            let result: boolean | undefined;
            if (task.isSimpleTask()) {
                result = await task.execute();
            } else if (task.isComplexTask()) {
                const validatedParams = task.validate(context.params);
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
