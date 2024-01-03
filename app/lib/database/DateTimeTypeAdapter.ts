// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { DefaultTypeAdapter, TypeAdapter } from 'ts-sql-query/TypeAdapter';
import { dayjs } from '@lib/DateTime';

/**
 * Type adapter to translate between DATE, DATETIME, TIME and TIMESTAMP fields in the database, and
 * our canonical date/time representation in TypeScript. All times and dates will be represented in
 * the UTC timezone, unless they're being presented to the user.
 */
export const DateTimeTypeAdapter = new class implements TypeAdapter {
    transformValueFromDB(value: unknown, type: string, next: DefaultTypeAdapter): unknown {
        if (![ 'date', 'dateTime', 'time', 'timestamp' ].includes(type))
            throw new Error(`Unexpected type received by DateTimeTypeAdapter: ${type}`);

        if (value === null || value === undefined)
            return value;  // pass-through nullsy values

        if (typeof value !== 'string')
            throw new Error(`Unexpected value received by DateTimeTypeAdapter: ${typeof value}`);

        const transformedValue = dayjs.utc(value);
        switch (type) {
            case 'date':
                return transformedValue.startOf('day');

            case 'dateTime':
            case 'timestamp':
                return transformedValue;

            case 'time':
                return transformedValue.set('year', 2000).set('month', 0).set('date', 1);
        }
    }

    transformValueToDB(value: unknown, type: string, next: DefaultTypeAdapter): unknown {
        if (![ 'date', 'dateTime', 'time', 'timestamp' ].includes(type))
            throw new Error(`Unexpected type received by DateTimeTypeAdapter: ${type}`);

        if (value === null || value === undefined)
            return value;  // pass-through nullsy values

        if (!dayjs.isDayjs(value))
            throw new Error(`Unexpected value received by DateTimeTypeAdapter: ${typeof value}`);

        switch (type) {
            case 'date':
                return value.utc().format('YYYY-MM-DD');

            case 'dateTime':
            case 'timestamp':
                return value.utc().format('YYYY-MM-DD[T]HH:mm:ss[Z]');

            case 'time':
                return value.utc().format('HH:mm:ss');
        }
    }
}
