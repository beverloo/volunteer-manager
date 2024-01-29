// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { DefaultTypeAdapter } from 'ts-sql-query/TypeAdapter';

import { TemporalTypeAdapter } from './TemporalTypeAdapter';
import { Temporal, formatDate } from '@lib/Temporal';

describe('TemporalTypeAdapter', () => {
    const adapter = TemporalTypeAdapter;

    const kNext: DefaultTypeAdapter = {
        transformValueFromDB(value: unknown, type: string): unknown { return null },
        transformValueToDB(value: unknown, type: string): unknown { return null; },
        transformPlaceholder(
            placeholder: string, type: string, forceTypeCast: boolean,
            valueSentToDB: unknown): string { return '' },
    };

    it('should reject type conversions for unrelated types', () => {
        expect(() => adapter.transformValueFromDB('2022-01-01', 'date', kNext)).not.toThrow();
        expect(() => adapter.transformValueFromDB('2022-01-01 00:00:00', 'dateTime', kNext))
            .not.toThrow();

        expect(() => adapter.transformValueFromDB('00:00:00', 'time', kNext)).not.toThrow();
        expect(() => adapter.transformValueFromDB('2022-01-01 00:00:00', 'timestamp', kNext))
            .not.toThrow();

        expect(() => adapter.transformValueFromDB({ /* object */ }, 'dateTime', kNext)).toThrow();
        expect(() => adapter.transformValueFromDB(42.1234, 'dateTime', kNext)).toThrow();
        expect(() => adapter.transformValueFromDB(true, 'dateTime', kNext)).toThrow();
        expect(() => adapter.transformValueFromDB(false, 'dateTime', kNext)).toThrow();
    });

    it('should always represent times in UTC, regardless of input timezone', () => {
        const transformations = [
            { type: 'date', input: null, output: null },
            { type: 'date', input: undefined, output: undefined },
            { type: 'date', input: '2024-01-03', output: '2024-01-03T00:00:00Z' },

            { type: 'dateTime', input: null, output: null },
            { type: 'dateTime', input: undefined, output: undefined },
            {
                type: 'dateTime',
                input: '2024-01-03 23:59:59',
                output: '2024-01-03T23:59:59Z'
            },

            { type: 'time', input: null, output: null },
            { type: 'time', input: undefined, output: undefined },
            { type: 'time', input: '00:00:00', output: '1970-01-01T00:00:00Z' },
            { type: 'time', input: '23:59:59', output: '1970-01-01T23:59:59Z' },

            { type: 'timestamp', input: null, output: null },
            { type: 'timestamp', input: undefined, output: undefined },
            {
                type: 'timestamp',
                input: '2024-01-03 23:59:59',
                output: '2024-01-03T23:59:59Z'
            },
        ];

        for (const { type, input, output } of transformations) {
            const actualOutput = adapter.transformValueFromDB(input, type, kNext);
            if (output === null) {
                expect(actualOutput).toBeNull();
            } else if (actualOutput === undefined) {
                expect(actualOutput).toBeUndefined();
            } else {
                expect(actualOutput).toBeInstanceOf(Temporal.ZonedDateTime);

                const actualOutputTemporal = actualOutput as Temporal.ZonedDateTime;
                expect(actualOutputTemporal.timeZoneId).toEqual('UTC');
                expect(formatDate(actualOutputTemporal, 'YYYY-MM-DD[T]HH:mm:ss[Z]')).toBe(output);
            }
        }
    });

    it('should always write values to the database assuming UTC times', () => {
        const transformations = [
            { type: 'date', input: null, output: null },
            { type: 'date', input: undefined, output: undefined },
            {
                type: 'date',
                input: Temporal.ZonedDateTime.from('2024-01-03T23:59:59-05:00[America/New_York]'),
                output: '2024-01-04',
            },
            {
                type: 'date',
                input: Temporal.ZonedDateTime.from('2024-01-03T00:00:00Z[UTC]'),
                output: '2024-01-03',
            },
            {
                type: 'date',
                input: Temporal.ZonedDateTime.from('2024-01-03T23:59:59Z[UTC]'),
                output: '2024-01-03',
            },
            {
                type: 'date',
                input: Temporal.ZonedDateTime.from('2024-01-03T00:59:59+09:00[Asia/Tokyo]'),
                output: '2024-01-02',
            },

            { type: 'dateTime', input: null, output: null },
            { type: 'dateTime', input: undefined, output: undefined },
            {
                type: 'dateTime',
                input: Temporal.ZonedDateTime.from('2024-01-03T23:59:59-05:00[America/New_York]'),
                output: '2024-01-04 04:59:59'
            },
            {
                type: 'dateTime',
                input: Temporal.ZonedDateTime.from('2024-01-03T23:59:59Z[UTC]'),
                output: '2024-01-03 23:59:59'
            },
            {
                type: 'dateTime',
                input: Temporal.ZonedDateTime.from('2024-01-03T00:59:59+09:00[Asia/Tokyo]'),
                output: '2024-01-02 15:59:59'
            },

            { type: 'time', input: null, output: null },
            { type: 'time', input: undefined, output: undefined },
            {
                type: 'time',
                input: Temporal.ZonedDateTime.from('2024-01-03T23:59:59-05:00[America/New_York]'),
                output: '04:59:59',
            },
            {
                type: 'time',
                input: Temporal.ZonedDateTime.from('2024-01-03T23:59:59Z[UTC]'),
                output: '23:59:59'
            },
            {
                type: 'time',
                input: Temporal.ZonedDateTime.from('2024-01-03T00:59:59+09:00[Asia/Tokyo]'),
                output: '15:59:59'
            },

            { type: 'timestamp', input: null, output: null },
            { type: 'timestamp', input: undefined, output: undefined },
            {
                type: 'timestamp',
                input: Temporal.ZonedDateTime.from('2024-01-03T23:59:59-05:00[America/New_York]'),
                output: '2024-01-04 04:59:59'
            },
            {
                type: 'timestamp',
                input: Temporal.ZonedDateTime.from('2024-01-03T23:59:59Z[UTC]'),
                output: '2024-01-03 23:59:59'
            },
            {
                type: 'timestamp',
                input: Temporal.ZonedDateTime.from('2024-01-03T00:59:59+09:00[Asia/Tokyo]'),
                output: '2024-01-02 15:59:59'
            },
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
