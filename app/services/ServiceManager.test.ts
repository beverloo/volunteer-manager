// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { ServiceDriver } from './ServiceDriver';
import type { ServiceLog } from './ServiceLog';

import { ServiceLogMock } from './ServiceLogMock';
import { ServiceManager } from './ServiceManager';

describe('ServiceManager', () => {
    afterEach(() => ServiceLogMock.Reset());

    type MockServiceParams = { case: string };

    /**
     * Mock service implementation used for testing of the service manager. Has different behaviours
     * based on the parameters that will be passed in to the service.
     */
    class MockService implements ServiceDriver<MockServiceParams> {
        async execute(log: ServiceLog, params: MockServiceParams): Promise<void> {
            switch (params.case) {
                case 'Exception':
                    throw new Error(params.case);

                case 'Error':
                    log.error(params.case);
                    break;

                default:
                    log.warning(params.case);
                    break;
            }
        }
    }

    it('is able to execute a series of services in sequence', async () => {
        const serviceManager = ServiceManager.CreateInstanceForTesting([
            {
                id: 0,
                name: 'MockService 1',
                eventId: 1,
                enabled: true,
                interval: 3600,
                driver: MockService,
                params: '{"case":"test1"}',
                secondsSinceLastExecution: 3601,
            },
            {
                id: 1,
                name: 'MockService 2',
                eventId: 2,
                enabled: true,
                interval: 3600,
                driver: MockService,
                params: '{"case":"test2"}',
                secondsSinceLastExecution: 3601,
            }
        ], ServiceLogMock);

        expect(await serviceManager.execute()).toBeTruthy();

        const logs = ServiceLogMock.TakeLogs();
        expect(logs).toHaveLength(2);

        expect(logs[0].state).toEqual('Warning');
        expect(logs[0].exceptions).toHaveLength(0);
        expect(logs[0].errors).toHaveLength(0);
        expect(logs[0].warnings).toHaveLength(1);

        expect(logs[0].warnings[0].data).toHaveLength(1);
        expect(logs[0].warnings[0].data[0]).toEqual('test1');

        expect(logs[1].state).toEqual('Warning');
        expect(logs[1].exceptions).toHaveLength(0);
        expect(logs[1].errors).toHaveLength(0);
        expect(logs[1].warnings).toHaveLength(1);

        expect(logs[1].warnings[0].data).toHaveLength(1);
        expect(logs[1].warnings[0].data[0]).toEqual('test2');
    });

    it('skips services when they have been recently executed', async () => {
        const serviceManager = ServiceManager.CreateInstanceForTesting([
            {
                id: 0,
                name: 'MockService',
                eventId: 1,
                enabled: true,
                interval: 3600,
                driver: MockService,
                params: '{"case":"test1"}',
                secondsSinceLastExecution: 3599,  // <---
            },
        ], ServiceLogMock);

        expect(await serviceManager.execute()).toBeTruthy();
        {
            const logs = ServiceLogMock.TakeLogs();
            expect(logs).toHaveLength(0);
        }

        expect(await serviceManager.execute(/* force= */ true)).toBeTruthy();
        {
            const logs = ServiceLogMock.TakeLogs();
            expect(logs).toHaveLength(1);  // `force` overrides `interval`
        }
    });

    it('skips services when they are disabled', async () => {
        const serviceManager = ServiceManager.CreateInstanceForTesting([
            {
                id: 0,
                name: 'MockService',
                eventId: 1,
                enabled: false,  // <---
                interval: 3600,
                driver: MockService,
                params: '{"case":"test1"}',
                secondsSinceLastExecution: 3601,
            },
        ], ServiceLogMock);

        expect(await serviceManager.execute()).toBeTruthy();
        {
            const logs = ServiceLogMock.TakeLogs();
            expect(logs).toHaveLength(0);
        }

        expect(await serviceManager.execute(/* force= */ true)).toBeTruthy();
        {
            const logs = ServiceLogMock.TakeLogs();
            expect(logs).toHaveLength(0);  // `force` does not override `enabled`
        }
    });

    it('considers tests that throw an exception as a failure', async () => {
        const serviceManager = ServiceManager.CreateInstanceForTesting([
            {
                id: 0,
                name: 'MockService',
                eventId: 1,
                enabled: true,
                interval: 3600,
                driver: MockService,
                params: '{"case":"Exception"}',
                secondsSinceLastExecution: 3601,
            },
        ], ServiceLogMock);

        expect(await serviceManager.execute()).toBeFalsy();
        {
            const logs = ServiceLogMock.TakeLogs();
            expect(logs).toHaveLength(1);

            expect(logs[0].state).toEqual('Exception');
            expect(logs[0].exceptions).toHaveLength(1);
            expect(logs[0].errors).toHaveLength(0);
            expect(logs[0].warnings).toHaveLength(0);

            expect(logs[0].exceptions[0].error.message).toEqual('Exception');
        }
    });

    it('considers tests that error as a failure', async () => {
        const serviceManager = ServiceManager.CreateInstanceForTesting([
            {
                id: 0,
                name: 'MockService',
                eventId: 1,
                enabled: true,
                interval: 3600,
                driver: MockService,
                params: '{"case":"Error"}',
                secondsSinceLastExecution: 3601,
            },
        ], ServiceLogMock);

        expect(await serviceManager.execute()).toBeFalsy();
        {
            const logs = ServiceLogMock.TakeLogs();
            expect(logs).toHaveLength(1);

            expect(logs[0].state).toEqual('Error');
            expect(logs[0].exceptions).toHaveLength(0);
            expect(logs[0].errors).toHaveLength(1);
            expect(logs[0].warnings).toHaveLength(0);

            expect(logs[0].errors[0].data).toHaveLength(1);
            expect(logs[0].errors[0].data[0]).toEqual('Error');
        }
    });
});
