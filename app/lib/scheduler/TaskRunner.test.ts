// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { MockScheduler } from './MockScheduler';

describe('TaskRunner', () => {
    it('should be able to execute built-in named tasks', async () => {
        const scheduler = new MockScheduler();

        // (1) Simple tasks
        {
            const result = await scheduler.taskRunner.executeTask({ taskName: 'NoopTask' });
            expect(result).toBeTrue();
        }

        // (2) Complex tasks
        {
            const result = await scheduler.taskRunner.executeTask({ taskName: 'NoopComplexTask' });
            expect(result).toBeFalse();  // change detector test for parameter support
        }
    });

    it('should reject tasks when they refer to an invalid built-in named task', async () => {
        const scheduler = new MockScheduler();

        const result = await scheduler.taskRunner.executeTask({ taskName: 'InvalidTask' });
        expect(result).toBeFalse();
    });

    it('should validate the parameters for a task ahead of executing it', async () => {
        // TODO: Implement this test.
    });

    it('should be able to automatically reschedule repeating tasks', async () => {
        // TODO: Implement this test.
    });

    it('should reject tasks when the given taskId is not known to the database', async () => {
        // TODO: Implement this test.
    });

    it('should reject tasks when the given taskId already has been executed', async () => {
        // TODO: Implement this test.
    });

    it('should log task execution result status and timing to the database', async () => {
        // TODO: Implement this test.
    });
});
