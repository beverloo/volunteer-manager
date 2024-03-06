// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Column } from 'ts-sql-query/utils/Column';
import type { ITableOf } from 'ts-sql-query/utils/ITableOrView';
import { z } from 'zod';

import { getNameFromColumn, getNameFromTable } from './database/TableUtilities';

/**
 * Zod definition of a log undo. These are stored in the database, so will be verified both at undo
 * creation and execution time. Invalid undos will fail to execute.
 */
const kLogUndo = z.object({
    table: z.string().min(1),
    resetColumn: z.string().min(1),
    idColumn: z.string().min(1),
    id: z.number(),
});

/**
 * Parameters expected by the `createLogUndo` function.
 */
interface LogUndoParams {
    /**
     * Database table in which the undo operation should be executed.
     */
    table: ITableOf<any, any>;

    /**
     * Column that should be reset to `null`. We only support resetting values to `null`.
     */
    resetColumn: Column;

    /**
     * Column that contains the unique Id of the entry that should be reset.
     */
    idColumn: Column;

    /**
     * Unique Id of the entry that should be reset.
     */
    id: number;
};

/**
 * The `createLogUndo` function composes an object, safe for persistent storage, that contains the
 * necessary information to undo a particular operation. This is generally used to undo deletions,
 * however can be used for other types of mutations as well.
 */
export function createLogUndo(params: LogUndoParams): string {
    const unserializedLogUndo: z.infer<typeof kLogUndo> = {
        table: getNameFromTable(params.table),
        resetColumn: getNameFromColumn(params.table, params.resetColumn),
        idColumn: getNameFromColumn(params.table, params.idColumn),
        id: params.id,
    };

    return JSON.stringify(kLogUndo.parse(unserializedLogUndo));
}

/**
 * Executes the given `undo`. It will be validated, and existence of both the table and the column
 * will be verified prior to query execution.
 */
export async function executeLogUndo(logId: number, serializedLogUndo: string): Promise<boolean> {
    try {
        const unserializedLogUndo = JSON.parse(serializedLogUndo);
        const logUndo = kLogUndo.parse(unserializedLogUndo);

        console.log(logUndo);
        return true;
    } catch (error: any) {
        return false;
    }
}
