/* eslint-disable quotes */
/**
 * DO NOT EDIT:
 *
 * This file has been auto-generated from database schema using ts-sql-codegen.
 * Any changes will be overwritten.
 */
import { Table } from "ts-sql-query/Table";
import type { DBConnection } from "../Connection";

export class ServicesLogsTable extends Table<DBConnection, 'ServicesLogsTable'> {
    serviceLogId = this.primaryKey('service_log_id', 'int');
    serviceId = this.column('service_id', 'int');
    serviceLogTimestamp = this.columnWithDefaultValue('service_log_timestamp', 'localDateTime');
    serviceLogRuntime = this.column('service_log_runtime', 'double');
    serviceLogData = this.column('service_log_data', 'string');

    constructor() {
        super('services_logs');
    }
}


