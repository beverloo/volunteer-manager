// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { ComparableValueSource, StringValueSource } from 'ts-sql-query/expressions/values';
import type { Table } from 'ts-sql-query/Table';
import type { WritableColumnKeys } from 'ts-sql-query/extras/types';
import { extractWritableColumnNamesFrom } from 'ts-sql-query/extras/utils';
import { optionalType, tableOrViewRef } from 'ts-sql-query/utils/symbols';

import type { DBConnection } from './Connection';
import type { PlainDate, PlainTime, ZonedDateTime } from '@lib/Temporal';
import { TemporalTypeAdapter } from './TemporalTypeAdapter';

/**
 * Type utility for removing properties that map to `never` from the given type `T`.
 */
type RemoveNeverKeys<T> = { [K in keyof T]: T[K] extends never ? never : K }[keyof T];

/**
 * Type definition that picks the columns in `Columns` that are value sources based on the Temporal
 * `ZonedDateTime` type, which are the ones we want to add string variants to. The correct table (or
 * view) references are maintained, as is optionality of the column.
 */
type SelectTemporalColumns<T extends Table<DBConnection, any>> = {
    [K in WritableColumnKeys<T>]-?:
        T[K] extends ComparableValueSource<any, ZonedDateTime, ZonedDateTime, any>
            ? StringValueSource<T[typeof tableOrViewRef], T[K][typeof optionalType]>
            : (T[K] extends ComparableValueSource<any, PlainDate, PlainDate, any>
                 ? StringValueSource<T[typeof tableOrViewRef], T[K][typeof optionalType]>
                 : (T[K] extends ComparableValueSource<any, PlainTime, PlainTime, any>
                    ? StringValueSource<T[typeof tableOrViewRef], T[K][typeof optionalType]>
                    : never));
};

/**
 * Type definition that composes string columns for the ZonedDateTime columns included in `Columns`.
 */
type ComposeGeneratedStringColumns<Columns> = {
    [K in RemoveNeverKeys<Columns> as K extends string ? `${K}String` : never]: Columns[K]
};

/**
 * Type definition that adds virtual columns to the given Table `T` for the date and time-related
 * column types that exist in our database system.
 */
type TableWithDateTimeStrings<T extends Table<DBConnection, any>> =
    T & ComposeGeneratedStringColumns<SelectTemporalColumns<T>>;

/**
 * The `withDateTimeStringColumns` utility function takes a ts-sql-query generated table scheme and
 * adds direct string access to DATE, DATETIME, TIME and TIMESTAMP columns. The same column names
 * will be maintained, however, with a "String" suffix.
 */
export function withDateTimeStringColumns<T extends Table<DBConnection, any>>(table: T)
    : TableWithDateTimeStrings<T>
{
    const anyTable = table as any;
    for (const column of extractWritableColumnNamesFrom(table)) {
        if (anyTable[column].__typeAdapter !== TemporalTypeAdapter)
            continue;  // `column` does not describe a temporal type

        const fragmentFn =
            anyTable[column].__optionalType === 'required' ? 'virtualColumnFromFragment'
                                                           : 'optionalVirtualColumnFromFragment';

        switch (anyTable[column].__valueType) {
            case 'date':
                anyTable[`${column}String`] =
                    anyTable[fragmentFn]('string', (fragment: any) =>
                        fragment.sql`date_format(${anyTable[column]}, "%Y-%m-%d")`);

                break;

            case 'dateTime':
            case 'timestamp':
                anyTable[`${column}String`] =
                    anyTable[fragmentFn]('string', (fragment: any) =>
                        fragment.sql`date_format(${anyTable[column]}, "%Y-%m-%dT%TZ[UTC]")`);

                break;

            case 'time':
                anyTable[`${column}String`] =
                    anyTable[fragmentFn]('string', (fragment: any) =>
                        fragment.sql`date_format(${anyTable[column]}, "%T")`);

                break;

            default:
                throw new Error('Unexpected non-date/time column using the temporal adapter');
        }
    }

    return anyTable;
}
