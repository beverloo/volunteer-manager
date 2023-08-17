// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { ServiceLogImpl } from './ServiceLogImpl';
import { useMockConnection } from '@app/lib/database/Connection';

describe('ServiceLogImpl', () => {
    const mockConnection = useMockConnection();

    it('is able to escalate failure statuses', () => {
        const log = new ServiceLogImpl(/* serviceId= */ 42);
        expect(log.stateForTesting).toBeUndefined();

        log.beginExecution();
        expect(log.stateForTesting).toBe('Success');
        expect(log.success).toBeTruthy();

        log.warning();
        expect(log.stateForTesting).toBe('Warning');
        expect(log.success).toBeTruthy();

        log.error();
        log.warning();
        expect(log.stateForTesting).toBe('Error');
        expect(log.success).toBeFalsy();

        log.exception(new Error);
        expect(log.stateForTesting).toBe('Exception');
        expect(log.success).toBeFalsy();
    });

    it('disallows message reporting outside of its contracted interface', async () => {
        const log = new ServiceLogImpl(/* serviceId= */ 42);
        expect(log.stateForTesting).toBeUndefined();

        expect(() => log.warning()).toThrowError();
        expect(() => log.error()).toThrowError();
        expect(() => log.exception(new Error)).toThrowError();

        log.beginExecution();

        expect(() => log.beginExecution()).toThrowError();

        expect(() => log.warning()).not.toThrowError();
        expect(() => log.error()).not.toThrowError();
        expect(() => log.exception(new Error)).not.toThrowError();  // state === 'Exception'

        expect(() => log.warning()).toThrowError();
        expect(() => log.error()).toThrowError();
        expect(() => log.exception(new Error)).toThrowError();

        mockConnection.expect('insert');
        await expect(async () => log.finishExecution()).not.toThrowError();

        await expect(async () => log.finishExecution()).rejects.toThrowError();
    });

    it('is able to calculate the runtime of executed services', async () => {
        {
            const log = new ServiceLogImpl(/* serviceId= */ 42);
            log.beginExecution();

            let receivedQuery: string | undefined;
            let receivedParams: any[] | undefined;

            mockConnection.expect('insert', (query, params) => {
                receivedQuery = query;
                receivedParams = params;
            });

            // no execution, execution time is pure overhead
            await log.finishExecution();

            expect(receivedQuery).not.toBeUndefined();
            expect(receivedParams).not.toBeUndefined();
            expect(receivedParams).toHaveLength(/* per current implementation */ 4);
            expect(receivedParams![2]).toBeLessThan(/* ms= */ 5);
        }

        {
            const log = new ServiceLogImpl(/* serviceId= */ 42);
            log.beginExecution();

            let receivedQuery: string | undefined;
            let receivedParams: any[] | undefined;

            mockConnection.expect('insert', (query, params) => {
                receivedQuery = query;
                receivedParams = params;
            });

            await new Promise(resolve => setTimeout(resolve, 50));
            await log.finishExecution();

            expect(receivedQuery).not.toBeUndefined();
            expect(receivedParams).not.toBeUndefined();
            expect(receivedParams).toHaveLength(/* per current implementation */ 4);
            expect(receivedParams![2]).toBeGreaterThanOrEqual(/* ms= */ 48);
        }
    });

    it('is able to serialize and track information about issues', async () => {
        const log = new ServiceLogImpl(/* serviceId= */ 42);
        log.beginExecution();

        log.warning('Hello, world!');
        log.error(3.1415);
        log.exception(new Error('Yo'));

        let receivedQuery: string | undefined;
        let receivedParams: any[] | undefined;

        mockConnection.expect('insert', (query, params) => {
            receivedQuery = query;
            receivedParams = params;
        });

        await log.finishExecution();

        expect(receivedQuery).not.toBeUndefined();
        expect(receivedParams).not.toBeUndefined();
        expect(receivedParams).toHaveLength(/* per current implementation */ 4);

        const messages = JSON.parse(receivedParams![3] as string);
        expect(messages).toHaveLength(3);
        expect(messages[0].type).toEqual('Exception');
        expect(messages[1]).toEqual({ type: 'Error', message: '3.1415' });
        expect(messages[2]).toEqual({ type: 'Warning', message: 'Hello, world!' });
    });
});
