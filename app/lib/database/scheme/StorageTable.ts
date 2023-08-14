/* eslint-disable quotes */
/**
 * DO NOT EDIT:
 *
 * This file has been auto-generated from database schema using ts-sql-codegen.
 * Any changes will be overwritten.
 */
import { Table } from "ts-sql-query/Table";
import type { DBConnection } from "../Connection";

export class StorageTable extends Table<DBConnection, 'StorageTable'> {
    fileId = this.primaryKey('file_id', 'int');
    fileHash = this.column('file_hash', 'string');
    fileDate = this.column('file_date', 'localDateTime');
    userId = this.column('user_id', 'int');

    constructor() {
        super('storage');
    }
}


