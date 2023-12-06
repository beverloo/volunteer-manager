// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import db, { tTasks } from '@lib/database';

/**
 * Maintains context that enables a particular task to be executed, and is able to synchronise that
 * with the database for tasks that are initiated that way.
 */
export class TaskContext {
    /**
     * Initialises a context for an ephemeral task, indicated by the `taskName` and optionally the
     * given `params`.
     */
    static forEphemeralTask(taskName: string, params: unknown) {
        return new TaskContext(taskName, params);
    }

    /**
     * Initialises a context for a static task, i.e. one that exists in the database, indicated by
     * the given `taskId` and optionally the given `params`. Will return `undefined` when the task
     * does not exist in the database, or has already been executed.
     */
    static async forStaticTask(taskId: number, params: unknown) {
        const task = await db.selectFrom(tTasks)
            .where(tTasks.taskId.equals(taskId))
                .and(tTasks.taskInvocationResult.isNull())
            .select({
                taskName: tTasks.taskName,
                params: tTasks.taskParams,
                interval: tTasks.taskScheduledIntervalMs,
            })
            .executeSelectNoneOrOne();

        if (!task)
            return undefined;  // the task does not exist in the database, or has already ran

        let deserializedParams: unknown;
        try {
            deserializedParams = JSON.parse(task.params ?? { /* no params */ });
        } catch (error: any) {
            return undefined;  // the task exists, but does not contain valid configuration
        }

        return new TaskContext(task.taskName, deserializedParams);
    }

    #taskName: string;
    #params: unknown;

    private constructor(taskName: string, params: unknown) {
        this.#taskName = taskName;
        this.#params = params;
    }

    /**
     * Returns the name of the task that should be executed. Not guaranteed to be valid.
     */
    get taskName(): string { return this.#taskName; }

    /**
     * Returns the parameters with which the task should be executed. Optional.
     */
    get params(): unknown { return this.#params; }

}
