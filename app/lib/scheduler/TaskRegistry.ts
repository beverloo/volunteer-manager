// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { NoopComplexTask } from './tasks/NoopComplexTask';
import { NoopTask } from './tasks/NoopTask';
import { PopulateSchedulerTask } from './tasks/PopulateSchedulerTask';
import { SendEmailTask } from './tasks/SendEmailTask';

/**
 * Object containing all tasks known to the AnimeCon Volunteer Manager. Each task must extend either
 * `Task` when no params are expected, or `TaskWithParams` when they are. The primary consumer of
 * the registry is the `TaskRunner`, which is responsible for execution.
 */
export const kTaskRegistry = {
    NoopComplexTask,
    NoopTask,
    PopulateSchedulerTask,
    SendEmailTask,
};

/**
 * Type containing the task names that are known to the scheduler.
 */
export type RegisteredTasks = keyof typeof kTaskRegistry;

/**
 * Function defining the formatter for a particular task.
 */
type TaskFormatFn = (params: any) => string;

/**
 * Registry of of the known tasks, each with a function that enables formatting their purpose.
 */
export const kTaskFormatFn: { [k in RegisteredTasks]: TaskFormatFn } = {
    NoopComplexTask: () => 'No-op task (complex)',
    NoopTask: () => 'No-op task',
    PopulateSchedulerTask: () => 'Populate scheduler task',
    SendEmailTask: params => `Send e-mail task (to: ${params.message.to})`,
};