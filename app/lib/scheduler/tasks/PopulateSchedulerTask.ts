// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { Task } from '../Task';
import db, { tTasks } from '@lib/database';

import { globalScheduler } from '../SchedulerImpl';

/**
 * Task that loads all pending tasks from the database and creates entries in the scheduler for
 * them. The scheduler state will be completely reset prior to the new tasks being queued.
 */
export class PopulateSchedulerTask extends Task {
    override async execute(): Promise<boolean> {
        const dbInstance = db;
        const differenceFragment = dbInstance.fragmentWithType('double', 'required').sql`
            TIMESTAMPDIFF(MICROSECOND, NOW(3), ${tTasks.taskScheduledDate}) / 1000`;

        const tasks = await db.selectFrom(tTasks)
            .where(tTasks.taskInvocationResult.isNull())
            .select({
                taskId: tTasks.taskId,
                delayMs: differenceFragment,
            })
            .orderBy('delayMs', 'desc')
            .executeSelectMany();

        globalScheduler.clearTasks();
        for (const { taskId, delayMs } of tasks)
            globalScheduler.queueTask({ taskId }, delayMs);

        return true;
    }
}
