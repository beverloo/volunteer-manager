// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { PopulateSchedulerTask } from './tasks/PopulateSchedulerTask';

/**
 * Task registry of all the tasks that are known to the scheduler. Unknown tasks yield an error.
 */
export const kSchedulerTaskRegistry = {
    PopulateSchedulerTask,
} as const;

/**
 * Human-readable names for each of the tasks known to the scheduler. Must be complete.
 */
export const kSchedulerTaskNames: { [k in keyof typeof kSchedulerTaskRegistry]: string } = {
    PopulateSchedulerTask: 'Populate the scheduler state',
};
