// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Column } from 'ts-sql-query/utils/Column';
import type { ITableOf } from 'ts-sql-query/utils/ITableOrView';
import * as tables from './index';

/**
 * Returns the Column instance for the column named `name` part of the given `table`. Undefined
 * will be returned when no column named `name` could be found.
 */
export function getColumnFromName<TABLE extends ITableOf<any, any>>(table: TABLE, name: string)
    : Column | undefined
{
    const memberName =
        name.toLowerCase().replace(/[-_][a-z0-9]/g, group => group.slice(-1).toUpperCase());

    return table[memberName as keyof typeof table] as Column | undefined;
}

/**
 * Returns the name of the given `column` that's part of the given `table`. An exception will be
 * thrown when the given `column` does not belong to the given `table`.
 */
export function getNameFromColumn<TABLE extends ITableOf<any, any>>(table: TABLE, column: Column)
    : string
{
    for (const [ memberName, memberValue ] of Object.entries(table)) {
        if (memberName.startsWith(/* internal= */ '_') || memberValue !== column)
            continue;

        return memberName.replace(/[A-Z]/g, match => `_${match.toLowerCase()}`);
    }

    throw new Error(`The given column (t=${table}, c=${column}) could not be identified.`);
}

/**
 * Returns the name of the given `table`. The `table` must be exported by the database library in
 * order for this function to be able to determine its name. An exception will be thrown when it
 * cannot be determined.
 */
export function getNameFromTable<TABLE extends ITableOf<any, any>>(table: TABLE): string {
    for (const [ exportName, exportValue ] of Object.entries(tables)) {
        /// @ts-ignore (ts2367) - This is exactly the comparison that we want to do.
        if (!exportName.startsWith('t') || table !== exportValue)
            continue;

        // Translate the export name (`tUsersEvents`) to the table name (`users_events`):
        return exportName.replace(/[A-Z]/g, match => `_${match.toLowerCase()}`).substring(2);
    }

    throw new Error(`The given table (t=${table}) could not be identified.`);
}

/**
 * Returns the Table instance for the table identified by the given `name`. The table must be
 * exported by the database library in order for this function to work.
 */
export function getTableFromName(name: string): ITableOf<any, any> | undefined {
    const unprefixedExportName = name.split('_')
        .map(word => `${word.charAt(0).toUpperCase()}${word.substring(1)}`)
        .join('');

    return tables[`t${unprefixedExportName}` as keyof typeof tables] as ITableOf<any, any>;
}
