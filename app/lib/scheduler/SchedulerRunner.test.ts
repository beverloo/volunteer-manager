// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { MockScheduler } from './MockScheduler';
import { SchedulerRunner } from './SchedulerRunner';

describe('SchedulerRunner', () => {
    jest.useFakeTimers();

    it('can provide execution for any number of schedulers', async () => {
        const runner = SchedulerRunner.createInstanceForTesting();
        expect(runner.active).toBeFalse();

        const runLoopPromise = runner.runLoop();
        expect(runner.active).toBeTrue();

        const firstScheduler = new MockScheduler();
        const secondScheduler = new MockScheduler();

        // First run: no schedulers should be executed.
        {
            await jest.advanceTimersToNextTimerAsync();

            expect(runner.active).toBeTrue();
            expect(firstScheduler.executionCount).toBe(0n);
            expect(secondScheduler.executionCount).toBe(0n);
        }

        // Second run: only the `firstScheduler` should be executed.
        {
            runner.attachScheduler(firstScheduler);

            await jest.advanceTimersToNextTimerAsync();

            expect(runner.active).toBeTrue();
            expect(firstScheduler.executionCount).toBe(1n);
            expect(secondScheduler.executionCount).toBe(0n);
        }

        // Third run: both the schedulers should be executed.
        {
            runner.attachScheduler(secondScheduler);

            await jest.advanceTimersToNextTimerAsync();

            expect(runner.active).toBeTrue();
            expect(firstScheduler.executionCount).toBe(2n);
            expect(secondScheduler.executionCount).toBe(1n);
        }

        // Fourth run: only the `secondScheduler` should be executed.
        {
            runner.detachScheduler(firstScheduler);

            await jest.advanceTimersToNextTimerAsync();

            expect(runner.active).toBeTrue();
            expect(firstScheduler.executionCount).toBe(2n);
            expect(secondScheduler.executionCount).toBe(2n);
        }

        runner.abort();

        await jest.runAllTimersAsync();
        await runLoopPromise;

        expect(runner.active).toBeFalse();
    });
});
