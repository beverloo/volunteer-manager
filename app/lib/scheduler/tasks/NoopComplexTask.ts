// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod/v4';

import { TaskWithParams } from '../Task';

/**
 * Parameter scheme applying to the `NoopComplexTask`.
 */
const kNoopComplexTaskParamScheme = z.object({
    /**
     * Whether execution of the task should succeed.
     */
    succeed: z.boolean(),

    /**
     * The interval at which the task should repeat itself, if any.
     */
    intervalMs: z.number().nullish(),

    /**
     * Whether a log entry should be written while executing this task.
     */
    logs: z.boolean().optional(),
});

/**
 * Type definition of the parameter scheme, to be used by TypeScript.
 */
type TaskParams = z.infer<typeof kNoopComplexTaskParamScheme>;

/**
 * The no-op complex task takes parameters, but does not do any actual work. It's used for testing
 * purposes where a task invocation is necessary.
 */
export class NoopComplexTask extends TaskWithParams<TaskParams> {
    override validate(params: unknown): TaskParams | never {
        return kNoopComplexTaskParamScheme.parse(params);
    }

    override async execute(params: TaskParams): Promise<boolean> {
        if (!!params.logs)
            this.log.info('Parameters=', params);

        if (params.intervalMs !== undefined)
            this.setIntervalForRepeatingTask(params.intervalMs ?? undefined);

        return params.succeed;
    }
}
