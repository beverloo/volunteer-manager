// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { DB } from 'ts-sql-query/typeMarks/MariaDBDB';
import type { ComparableValueSource } from 'ts-sql-query/expressions/values';
import type { StringFragmentExpression } from 'ts-sql-query/expressions/fragment';
import { optionalType, } from 'ts-sql-query/utils/symbols';

import type { PlainDate, PlainTime, ZonedDateTime } from '@lib/Temporal';

/**
 * Creates a fragment that can be used to compose a string from a `DATE` column.
 */
export function CreateDateStringFragment<
    C extends ComparableValueSource<any, PlainDate, PlainDate, any>>(column: C)
{
    return (fragment: StringFragmentExpression<DB<'DBConnection'>, C[typeof optionalType]>) =>
        fragment.sql`date_format(${column}, "%Y-%m-%d")`;
}

/**
 * Creates a fragment that can be used to compose a string from a `DATETIME` column.
 */
export function CreateDateTimeStringFragment<
    C extends ComparableValueSource<any, ZonedDateTime, ZonedDateTime, any>>(column: C)
{
    return (fragment: StringFragmentExpression<DB<'DBConnection'>, C[typeof optionalType]>) =>
        fragment.sql`date_format(${column}, "%Y-%m-%dT%TZ[UTC]")`;
}

/**
 * Creates a fragment that can be used to compose a string for a `TIMESTAMP` fragment.
 */
export function CreateTimestampStringFragment<
    C extends ComparableValueSource<any, ZonedDateTime, ZonedDateTime, any>>(column: C)
{
    return (fragment: StringFragmentExpression<DB<'DBConnection'>, C[typeof optionalType]>) =>
        fragment.sql`date_format(${column}, "%Y-%m-%dT%TZ[UTC]")`;
}

/**
 * Creates a fragment that can be used to compose a string from a `DATE` column.
 */
export function CreateTimeStringFragment<
    C extends ComparableValueSource<any, PlainTime, PlainTime, any>>(column: C)
{
    return (fragment: StringFragmentExpression<DB<'DBConnection'>, C[typeof optionalType]>) =>
        fragment.sql`date_format(${column}, "%T")`;
}
