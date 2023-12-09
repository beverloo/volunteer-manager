// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { TaskResult } from './Task';
import db, { tTasks } from '@lib/database';

/**
 * Configuration that exists for any given task.
 */
interface TaskConfiguration {
    taskId?: number;
    taskName: string;
    params: unknown;
    intervalMs?: number;
}

/**
 * Severity level of an entry logged during task execution.
 */
enum TaskLogSeverity {
    Debug = 'Debug',
    Info = 'Info',
    Warning = 'Warning',
    Error = 'Error',
    Exception = 'Exception',
}

/**
 * Individual log entry to be stored each time a task requests something to be logged.
 */
interface TaskLogEntry {
    severity: TaskLogSeverity;
    message: string;
    data: any[];
}

/**
 * Provides the ability for task execution to log information. This will be shown, in chronological
 * order, in the task overview page part of the administration area.
 */
class TaskLogger {
    #logs: TaskLogEntry[] = [];

    debug(message: string, ...args: any[]) {
        this.#logs.push({
            severity: TaskLogSeverity.Debug,
            data: args, message,
        });
    }

    info(message: string, ...args: any[]) {
        this.#logs.push({
            severity: TaskLogSeverity.Info,
            data: args, message,
        });
    }

    warning(message: string, ...args: any[]) {
        this.#logs.push({
            severity: TaskLogSeverity.Warning,
            data: args, message,
        });
    }

    error(message: string, ...args: any[]) {
        this.#logs.push({
            severity: TaskLogSeverity.Error,
            data: args, message,
        });
    }

    exception(message: string, ...args: any[]) {
        this.#logs.push({
            severity: TaskLogSeverity.Exception,
            data: args, message,
        });
    }
}

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
        return new TaskContext({ taskName, params });
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
                intervalMs: tTasks.taskScheduledIntervalMs,
            })
            .executeSelectNoneOrOne();

        if (!task)
            return undefined;  // the task does not exist in the database, or has already ran

        let deserializedParams: unknown;
        try {
            deserializedParams = JSON.parse(task.params ?? /* no params= */ '{}');
        } catch (error: any) {
            return undefined;  // the task exists, but does not contain valid configuration
        }

        return new TaskContext({
            ...task,
            params: deserializedParams,
        });
    }

    #configuration: TaskConfiguration;
    #executionStart?: bigint;
    #executionFinished?: bigint;
    #logger: TaskLogger;

    private constructor(configuration: TaskConfiguration) {
        this.#configuration = configuration;
        this.#executionStart = undefined;
        this.#executionFinished = undefined;
        this.#logger = new TaskLogger;
    }

    /**
     * Returns the name of the task that should be executed. Not guaranteed to be valid.
     */
    get taskName(): string { return this.#configuration.taskName; }

    /**
     * Returns the parameters with which the task should be executed. Optional.
     */
    get params(): unknown { return this.#configuration.params; }

    /**
     * Returns the logger that can be used for this task execution.
     */
    get log(): TaskLogger { return this.#logger; }

    /**
     * Marks that task execution has begun. Will throw if exeuction has already started.
     */
    markTaskExecutionStart(): void {
        if (!!this.#executionStart)
            throw new Error('Task execution has already started, unable to restart');

        this.#executionStart = process.hrtime.bigint();
    }

    /**
     * Marks that task execution has finished. Will throw if execution has not started yet, and when
     * execution has already been marked as finished.
     */
    markTaskExecutionFinished(): void {
        if (!this.#executionStart)
            throw new Error('Task execution has not started yet');

        if (!!this.#executionFinished)
            throw new Error('Task exeuction has already finished, unable to restart');

        this.#executionFinished = process.hrtime.bigint();
    }

    /**
     * Finalizes the task by writing the execution log to the database for static tasks, or by
     * simply declaring victory in case of ephemeral tasks. Will automatically reschedule the task
     * to be exeucted when an interval has been given.
     */
    async finalize(result: TaskResult) {
        // TODO: Write static information to the database (result, logs, execution time).
        // TODO: Reschedule the task if an interval is known.
    }
}
