// @ts-nocheck
/* eslint-disable quotes, max-len */
/**
 * DO NOT EDIT:
 *
 * This file has been auto-generated from database schema using ts-sql-codegen.
 * Any changes will be overwritten.
 */
import { Table } from "ts-sql-query/Table";
import type { DBConnection } from "../Connection";
import {
    TemporalTypeAdapter,
} from "../TemporalTypeAdapter";
import {
    ZonedDateTime,
} from "../../Temporal";
import {
    LogSeverity,
} from "../Types";

export class LogsTable extends Table<DBConnection, 'LogsTable'> {
    logId = this.autogeneratedPrimaryKey('log_id', 'int');
    logDate = this.columnWithDefaultValue<ZonedDateTime>('log_date', 'customComparable', 'timestamp', TemporalTypeAdapter);
    logType = this.column('log_type', 'string');
    logSeverity = this.column<LogSeverity>('log_severity', 'enum', 'LogSeverity');
    logSourceUserId = this.optionalColumnWithDefaultValue('log_source_user_id', 'int');
    logTargetUserId = this.optionalColumnWithDefaultValue('log_target_user_id', 'int');
    logData = this.optionalColumnWithDefaultValue('log_data', 'string');

    constructor() {
        super('logs');
    }
}


