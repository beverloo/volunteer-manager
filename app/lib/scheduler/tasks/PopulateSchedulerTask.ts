// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { SchedulerTaskParams } from '../SchedulerTask';

/**
 * Task that will fetch all pending tasks from the database and reset the existing scheduler so that
 * its internal state matches the database. Invoked automatically when the scheduler starts, and
 * can be executed manually by administrators as well.
 */
export async function PopulateSchedulerTask(params: SchedulerTaskParams): Promise<any> {
    // TODO: Implement this task.
}
