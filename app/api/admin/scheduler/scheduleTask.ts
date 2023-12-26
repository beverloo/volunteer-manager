// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import type { ActionProps } from '../../Action';
import { Privilege } from '@lib/auth/Privileges';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';

import { kTaskRegistry } from '@lib/scheduler/TaskRegistry';
import { scheduleTask as actuallyScheduleTask } from '@lib/scheduler';

/**
 * Interface definition for an API to schedule a task, exposed through /api/admin/scheduler
 */
export const kScheduleTaskDefinition = z.object({
    request: z.object({
        /**
         * Name of the task that should be scheduled.
         */
        taskName: z.string(),

        /**
         * The parameters that should be passed to the task, if any.
         */
        taskParams: z.any(),

        /**
         * Delay that should be applied to the task, in milliseconds.
         */
        delayMs: z.number(),
    }),
    response: z.strictObject({
        /**
         * Whether the operation could be completed successfully.
         */
        success: z.boolean(),

        /**
         * Optional error message explaining what went wrong.
         */
        error: z.string().optional(),
    }),
});

export type ScheduleTaskDefinition = z.infer<typeof kScheduleTaskDefinition>;

type Request = ScheduleTaskDefinition['request'];
type Response = ScheduleTaskDefinition['response'];

/**
 * API that allows a new task to be scheduled.
 */
export async function scheduleTask(request: Request, props: ActionProps): Promise<Response> {
    executeAccessCheck(props.authenticationContext, {
        check: 'admin',
        privilege: Privilege.SystemAdministrator,
    });

    if (!Object.hasOwn(kTaskRegistry, request.taskName))
        return { success: false, error: `Unrecognised task name ("${request.taskName}")` };

    await actuallyScheduleTask({
        taskName: request.taskName as keyof typeof kTaskRegistry,
        params: request.taskParams,
        delayMs: request.delayMs,
        intervalMs: /* no interval= */ undefined,
    });

    return { success: true };
}
