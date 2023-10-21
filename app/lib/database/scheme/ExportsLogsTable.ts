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

export class ExportsLogsTable extends Table<DBConnection, 'ExportsLogsTable'> {
    exportId = this.column('export_id', 'int');
    accessDate = this.columnWithDefaultValue('access_date', 'localDateTime');
    accessIpAddress = this.column('access_ip_address', 'string');
    accessUserAgent = this.column('access_user_agent', 'string');
    accessUserId = this.optionalColumnWithDefaultValue('access_user_id', 'int');

    constructor() {
        super('exports_logs');
    }
}


