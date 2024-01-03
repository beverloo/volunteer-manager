// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { DefaultTypeAdapter } from 'ts-sql-query/TypeAdapter';

import { DateTimeTypeAdapter } from './DateTimeTypeAdapter';
import { dayjs } from '@lib/DateTime';

describe('DateTimeTypeAdapter', () => {
    const adapter = DateTimeTypeAdapter;

    const kNext: DefaultTypeAdapter = {
        transformValueFromDB(value: unknown, type: string): unknown { return null },
        transformValueToDB(value: unknown, type: string): unknown { return null; },
        transformPlaceholder(
            placeholder: string, type: string, forceTypeCast: boolean,
            valueSentToDB: unknown): string { return '' },
    };

    it('should reject type conversions for unrelated types', () => {
        expect(() => adapter.transformValueFromDB('2022-01-01', 'date', kNext)).not.toThrow();
        expect(() => adapter.transformValueFromDB('2022-01-01', 'dateTime', kNext)).not.toThrow();
        expect(() => adapter.transformValueFromDB('2022-01-01', 'time', kNext)).not.toThrow();
        expect(() => adapter.transformValueFromDB('2022-01-01', 'timestamp', kNext)).not.toThrow();

        expect(() => adapter.transformValueFromDB({ /* object */ }, 'dateTime', kNext)).toThrow();
        expect(() => adapter.transformValueFromDB(42.1234, 'dateTime', kNext)).toThrow();
        expect(() => adapter.transformValueFromDB(true, 'dateTime', kNext)).toThrow();
        expect(() => adapter.transformValueFromDB(false, 'dateTime', kNext)).toThrow();
    });

    it('should always represent times in UTC, regardless of input timezone', () => {
        const transformations = [
            { type: 'date', input: null, output: null },
            { type: 'date', input: undefined, output: undefined },
            { type: 'date', input: '2024-01-03Z', output: '2024-01-03T00:00:00Z' },
            { type: 'date', input: '2024-01-03T00:00:00-05:00', output: '2024-01-03T00:00:00Z' },
            { type: 'date', input: '2024-01-03T00:00:00Z', output: '2024-01-03T00:00:00Z' },
            { type: 'date', input: '2024-01-03T00:00:00+05:00', output: '2024-01-02T00:00:00Z' },
            { type: 'date', input: '2024-01-03T12:00:00Z', output: '2024-01-03T00:00:00Z' },
            { type: 'date', input: '2024-01-03T23:59:59Z', output: '2024-01-03T00:00:00Z' },

            { type: 'dateTime', input: null, output: null },
            { type: 'dateTime', input: undefined, output: undefined },
            {
                type: 'dateTime',
                input: '2024-01-03T23:59:59-05:00',
                output: '2024-01-04T04:59:59Z'
            },
            {
                type: 'dateTime',
                input: '2024-01-03T23:59:59Z',
                output: '2024-01-03T23:59:59Z'
            },
            {
                type: 'dateTime',
                input: '2024-01-03T23:59:59+02:00',
                output: '2024-01-03T21:59:59Z'
            },

            { type: 'time', input: null, output: null },
            { type: 'time', input: undefined, output: undefined },
            { type: 'time', input: '2024-01-03Z', output: '2000-01-01T00:00:00Z' },
            { type: 'time', input: '2024-01-03T23:59:59', output: '2000-01-01T23:59:59Z' },
            { type: 'time', input: '2024-01-03T23:59:59-05:00', output: '2000-01-01T04:59:59Z' },
            { type: 'time', input: '2024-01-03T23:59:59Z', output: '2000-01-01T23:59:59Z' },
            { type: 'time', input: '2024-01-03T23:59:59+05:00', output: '2000-01-01T18:59:59Z' },

            { type: 'timestamp', input: null, output: null },
            { type: 'timestamp', input: undefined, output: undefined },
            // TODO: Add better tests for the `timestamp` type. It's likely equal to `dateTime` but
            // we'll have to validate that.
        ];

        for (const { type, input, output } of transformations) {
            const actualOutput = adapter.transformValueFromDB(input, type, kNext);
            if (output === null) {
                expect(actualOutput).toBeNull();
            } else if (actualOutput === undefined) {
                expect(actualOutput).toBeUndefined();
            } else {
                expect(dayjs.isDayjs(actualOutput)).toBeTrue();

                const actualOutputDayjs = actualOutput as dayjs.Dayjs;
                expect(actualOutputDayjs.isUTC()).toBeTrue();
                expect(actualOutputDayjs.format()).toBe(output);
            }
        }
    });

    it('should always write values to the database assuming UTC times', () => {
        const transformations = [
            { type: 'date', input: null, output: null },
            { type: 'date', input: undefined, output: undefined },
            { type: 'date', input: dayjs.utc('2024-01-03'), output: '2024-01-03' },
            { type: 'date', input: dayjs.utc('2024-01-03Z'), output: '2024-01-03' },
            { type: 'date', input: dayjs.utc('2024-01-03T23:59:59-05:00'), output: '2024-01-04' },
            { type: 'date', input: dayjs.utc('2024-01-03T23:59:59Z'), output: '2024-01-03' },
            { type: 'date', input: dayjs.utc('2024-01-03T00:59:59+05:00'), output: '2024-01-02' },
            {
                type: 'date',
                input: dayjs.tz('2024-01-03 23:59:59', 'Pacific/Honolulu'),
                output: '2024-01-04',
            },
            {
                type: 'date',
                input: dayjs.tz('2024-01-03 00:59:59', 'Asia/Tokyo'),
                output: '2024-01-02',
            },

            { type: 'dateTime', input: null, output: null },
            { type: 'dateTime', input: undefined, output: undefined },
            {
                type: 'dateTime',
                input: dayjs.utc('2024-01-03T23:59:59-05:00'),
                output: '2024-01-04 04:59:59'
            },
            {
                type: 'dateTime',
                input: dayjs.utc('2024-01-03T23:59:59Z'),
                output: '2024-01-03 23:59:59'
            },
            {
                type: 'dateTime',
                input: dayjs.utc('2024-01-03T23:59:59+05:00'),
                output: '2024-01-03 18:59:59'
            },
            {
                type: 'dateTime',
                input: dayjs.tz('2024-01-03 23:59:59', 'Pacific/Honolulu'),
                output: '2024-01-04 09:59:59',
            },
            {
                type: 'dateTime',
                input: dayjs.tz('2024-01-03 00:59:59', 'Asia/Tokyo'),
                output: '2024-01-02 15:59:59',
            },

            { type: 'time', input: null, output: null },
            { type: 'time', input: undefined, output: undefined },
            { type: 'time', input: dayjs.utc('2024-01-03T23:59:59'), output: '23:59:59' },
            { type: 'time', input: dayjs.utc('2024-01-03T23:59:59-05:00'), output: '04:59:59' },
            { type: 'time', input: dayjs.utc('2024-01-03T23:59:59Z'), output: '23:59:59' },
            { type: 'time', input: dayjs.utc('2024-01-03T23:59:59+05:00'), output: '18:59:59' },
            {
                type: 'time',
                input: dayjs.tz('2024-01-03 23:59:59', 'Pacific/Honolulu'),
                output: '09:59:59',
            },
            {
                type: 'time',
                input: dayjs.tz('2024-01-03 00:59:59', 'Asia/Tokyo'),
                output: '15:59:59',
            },

            { type: 'timestamp', input: null, output: null },
            { type: 'timestamp', input: undefined, output: undefined },
            // TODO: Add better tests for the `timestamp` type. It's likely equal to `dateTime` but
            // we'll have to validate that.
        ];

        for (const { type, input, output } of transformations) {
            const actualOutput = adapter.transformValueToDB(input, type, kNext);
            if (output === null) {
                expect(actualOutput).toBeNull();
            } else if (actualOutput === undefined) {
                expect(actualOutput).toBeUndefined();
            } else {
                expect(actualOutput).toBe(output);
            }
        }
    });
});
