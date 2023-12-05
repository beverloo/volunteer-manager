// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { Task } from '../Task';

/**
 * The no-op task takes no parameters and does not do any actual work. It's used for testing
 * purposes where a task invocation is necessary.
 */
export class NoopTask extends Task {
    override async execute(): Promise<boolean> {
        return true;
    }
}
