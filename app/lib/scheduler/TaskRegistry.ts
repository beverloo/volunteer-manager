// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { NoopComplexTask } from './tasks/NoopComplexTask';
import { NoopTask } from './tasks/NoopTask';
import { PopulateSchedulerTask } from './tasks/PopulateSchedulerTask';

/**
 * Object containing all tasks known to the AnimeCon Volunteer Manager. Each task must extend either
 * `Task` when no params are expected, or `TaskWithParams` when they are. The primary consumer of
 * the registry is the `TaskRunner`, which is responsible for execution.
 */
export const kTaskRegistry = {
    NoopComplexTask,
    NoopTask,
    PopulateSchedulerTask,
};
