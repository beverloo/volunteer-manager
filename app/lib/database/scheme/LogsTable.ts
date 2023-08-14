/* eslint-disable quotes */
/**
 * DO NOT EDIT:
 *
 * This file has been auto-generated from database schema using ts-sql-codegen.
 * Any changes will be overwritten.
 */
import { Table } from "ts-sql-query/Table";
import type { DBConnection } from "../Connection";

export class LogsTable extends Table<DBConnection, 'LogsTable'> {
    logId = this.primaryKey('log_id', 'int');
    logDate = this.columnWithDefaultValue('log_date', 'localDateTime');
    logType = this.column('log_type', 'string');
    logSourceUserId = this.optionalColumnWithDefaultValue('log_source_user_id', 'int');
    logTargetUserId = this.optionalColumnWithDefaultValue('log_target_user_id', 'int');
    logData = this.optionalColumnWithDefaultValue('log_data', 'string');

    constructor() {
        super('logs');
    }
}


