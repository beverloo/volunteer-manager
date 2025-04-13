// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { ImportYourTicketProviderTask } from './ImportYourTicketProviderTask';
import { TaskContext } from '../TaskContext';
import { Temporal, formatDate } from '@lib/Temporal';
import { useMockConnection } from '@lib/database/Connection';

describe('ImportYourTicketProviderTask', () => {
    const mockConnection = useMockConnection();

    interface FestivalOptions {
        id: number;
        name: string;
        endTime: string;  // YYYY-MM-DD HH:mm:ss
        yourTicketProviderId: number;
    }

    function createImportYourTicketProviderTask(
        options?: FestivalOptions | FestivalOptions[],
        skipUpdate?: boolean)
    {
        const context = TaskContext.forEphemeralTask('ImportYourTicketProviderTask', {});
        const task = new class extends ImportYourTicketProviderTask {
            constructor() {
                super(context);
            }

            override async executeForEvent(dbInstance: any, event: any): Promise<void> {
                if (!skipUpdate)
                    await super.executeForEvent(dbInstance, event);
            }
        };

        expect(task.isComplexTask()).toBeFalse();

        mockConnection.expect('selectManyRows', () => {
            if (!options)
                return undefined;

            return Array.isArray(options) ? options : [ options ];
        });

        return task;
    }

    it('should skip when there are no upcoming festivals', async () => {
        const task = createImportYourTicketProviderTask([ /* no events */ ]);
        expect(task.contextForTesting.intervalMsForTesting).toBeUndefined();

        const result = await task.execute();
        expect(result).toBeTrue();

        expect(task.log.entries).toHaveLength(1);
        expect(task.log.entries[0].message).toInclude('No future events');

        expect(task.contextForTesting.intervalMsForTesting).toBe(
            ImportYourTicketProviderTask.kIntervalMaximum);
    });

    it('should scale the task interval based on duration until the festival', async () => {
        const finalTestCase =
            ImportYourTicketProviderTask.kIntervalConfiguration[
                ImportYourTicketProviderTask.kIntervalConfiguration.length - 1];

        const kTestCases = [
            ...ImportYourTicketProviderTask.kIntervalConfiguration,
            {
                maximumDays: finalTestCase.maximumDays + 2,
                intervalMs: ImportYourTicketProviderTask.kIntervalMaximum,
            },
        ];

        expect(kTestCases.length).toBeGreaterThan(0);

        for (const { maximumDays, intervalMs } of kTestCases) {
            const task = createImportYourTicketProviderTask([
                {
                    id: 100,
                    name: 'AnimeCon',
                    endTime: formatDate(
                        Temporal.Now.zonedDateTimeISO('UTC').add({ days: maximumDays }),
                        'YYYY-MM-DD HH:mm:ss'),
                    yourTicketProviderId: 1337,
                }
            ], /* skipUpdate= */ true);

            const result = await task.execute();
            expect(result).toBeTrue();

            expect(task.contextForTesting.intervalMsForTesting).toBe(intervalMs);
        }
    });

    it('should upsert information retrieved from the API in the database', async () => {
        // TODO
    });

    it('should update the product description when it changed', async () => {
        // TODO
    });

    it('should update maximum ticket information in the database when it changed', async () => {
        // TODO
    });
});
