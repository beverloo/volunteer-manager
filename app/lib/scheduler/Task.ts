// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { TaskResult } from '../database/Types';
export { TaskResult };

/**
 * Abstract class describing a task that can be owned by the `TaskRegistry` and executed using the
 * `TaskRunner`. It implements basic functionality minimising the per-task implementation cost.
 */
abstract class TaskBase {
    #acceptsParams: boolean;

    protected constructor(acceptsParams: boolean) {
        this.#acceptsParams = acceptsParams;
    }

    /**
     * Returns whether `this` represents a simple task, i.e. one without parameters.
     */
    isSimpleTask(): this is Task { return !this.#acceptsParams; }

    /**
     * Returns whether `this` represents a complex task, i.e. one that accepts parameters.
     */
    isComplexTask(): this is TaskWithParams<unknown> { return !!this.#acceptsParams; }
}

/**
 * Abstract class to extend when the task is not expecting to take any parameters.
 */
export abstract class Task extends TaskBase {
    constructor() {
        super(/* acceptsParams= */ false);
    }

    /**
     * Executes the task. No parameters are accepted.
     */
    abstract execute(): Promise<boolean>;
}

/**
 * Abstract class to extend when the task is expecting to take parameters. The parameters will be
 * validated prior to being passed to the `execute()` method.
 */
export abstract class TaskWithParams<ParamsType> extends TaskBase {
    constructor() {
        super(/* acceptsParams= */ true);
    }

    /**
     * Validates that the given `params` validate in accordance to the expected syntax.
     */
    abstract validate(params: unknown): ParamsType | never;

    /**
     * Executes the task with the given `params`.
     */
    abstract execute(params: ParamsType): Promise<boolean>;
}
