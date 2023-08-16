// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type DatabasePrimitive, kDatabase } from '../lib/database/Database';
import { Result } from '../lib/database/Result';
import { ServiceLogImpl } from './ServiceLogImpl';

describe('ServiceLogImpl', () => {
    let latestQuery: string | undefined;
    let latestParameters: DatabasePrimitive[] | undefined;

    beforeEach(() => {
        latestQuery = undefined;
        latestParameters = undefined;

        kDatabase.setDelegateForTesting({
            async query(query: string, parameters?: DatabasePrimitive[]): Promise<Result> {
                latestQuery = query;
                latestParameters = parameters;

                return Result.createErrorForTesting();
            }
        });
    });

    afterEach(() => kDatabase.setDelegateForTesting(/* reset= */ undefined));

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

    it('disallows messasge reporting outside of its contracted interface', async () => {
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

        await expect(async () => log.finishExecution()).not.toThrowError();
        await expect(async () => log.finishExecution()).rejects.toThrowError();
    });

    it('is able to calculate the runtime of executed services', async () => {
        {
            const log = new ServiceLogImpl(/* serviceId= */ 42);
            log.beginExecution();

            // no execution, execution time is pure overhead
            await log.finishExecution();

            expect(latestQuery).not.toBeUndefined();
            expect(latestParameters).not.toBeUndefined();
            expect(latestParameters).toHaveLength(/* per current implementation */ 4);
            expect(latestParameters![2]).toBeLessThan(/* ms= */ 5);
        }

        latestQuery = undefined;
        latestParameters = undefined;

        {
            const log = new ServiceLogImpl(/* serviceId= */ 42);
            log.beginExecution();

            await new Promise(resolve => setTimeout(resolve, 50));
            await log.finishExecution();

            expect(latestQuery).not.toBeUndefined();
            expect(latestParameters).not.toBeUndefined();
            expect(latestParameters).toHaveLength(/* per current implementation */ 4);
            expect(latestParameters![2]).toBeGreaterThanOrEqual(/* ms= */ 48);
        }
    });

    it('is able to serialize and track information about issues', async () => {
        const log = new ServiceLogImpl(/* serviceId= */ 42);
        log.beginExecution();

        log.warning('Hello, world!');
        log.error(3.1415);
        log.exception(new Error('Yo'));

        await log.finishExecution();

        expect(latestQuery).not.toBeUndefined();
        expect(latestParameters).not.toBeUndefined();
        expect(latestParameters).toHaveLength(/* per current implementation */ 4);

        const messages = JSON.parse(latestParameters![3] as string);
        expect(messages).toHaveLength(3);
        expect(messages[0].type).toEqual('Exception');
        expect(messages[1]).toEqual({ type: 'Error', message: '3.1415' });
        expect(messages[2]).toEqual({ type: 'Warning', message: 'Hello, world!' });
    });
});
