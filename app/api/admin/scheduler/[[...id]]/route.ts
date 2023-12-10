// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { type DataTableEndpoints, createDataTableApi } from '../../../createDataTableApi';
import { Privilege } from '@lib/auth/Privileges';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import db, { tTasks } from '@lib/database';

/**
 * Row model an entry from the scheduler.
 */
const kSchedulerRowModel = z.object({
    /**
     * Unique ID of the content as it exists in the database.
     */
    id: z.number(),

    /**
     * State of the task as it should be displayed.
     */
    state: z.enum([ 'pending', 'success', 'warning', 'failure' ]),

    /**
     * Date on which the task has been scheduled to execute.
     */
    date: z.string(),

    /**
     * Name of the task that's been scheduled for execuction.
     */
    task: z.string(),

    /**
     * Interval of the task, in case it's repeating.
     */
    executionInterval: z.number().optional(),

    /**
     * Execution time of the task, in milliseconds, when it's completed.
     */
    executionTime: z.number().optional(),
});

/**
 * The Export API does not require any context.
 */
const kSchedulerContext = z.never();

/**
 * Export type definitions so that the API can be used in `callApi()`.
 */
export type SchedulerEndpoints =
    DataTableEndpoints<typeof kSchedulerRowModel, typeof kSchedulerContext>;

/**
 * Export type definition for the Content DataTable API's Row Model.
 */
export type SchedulerRowModel = z.infer<typeof kSchedulerRowModel>;

/**
 * The Scheduler API is implemented as a regular DataTable API.
 *
 * The following endpoints are provided by this implementation:

 *     GET /api/admin/content
 *     GET /api/admin/content/:id
 */
export const { GET } = createDataTableApi(kSchedulerRowModel, kSchedulerContext, {
    async accessCheck(context, action, props) {
        executeAccessCheck(props.authenticationContext, {
            check: 'admin',
            privilege: Privilege.SystemContentAccess,
        });
    },

    async get({ id }) {
        return {
            success: false,
            error: 'Not yet implemented',
        }
    },

    async list({ pagination }) {
        const tasks = await db.selectFrom(tTasks)
            .select({
                id: tTasks.taskId,
                date: tTasks.taskScheduledDate,
                task: tTasks.taskName,
                executionInterval: tTasks.taskScheduledIntervalMs,
                executionTime: tTasks.taskInvocationTimeMs,
            })
            .orderBy('date', 'desc nulls first')
            .limitIfValue(pagination ? pagination.pageSize : null)
                .offsetIfValue(pagination ? pagination.page * pagination.pageSize : null)
            .executeSelectPage();

        return {
            success: true,
            rowCount: tasks.count,
            rows: tasks.data.map(row => {
                return {
                    id: row.id,
                    state: 'pending',
                    date: row.date.toISOString(),
                    task: row.task,
                    executionInterval: row.executionInterval,
                    executionTime: row.executionTime,
                } as const;
            }),
        }
    },
});
