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
    BlobTypeAdapter,
} from "../BlobTypeAdapter";
import {
    FileType,
} from "../Types";
import {
    ZonedDateTime,
} from "../../Temporal";

export class StorageTable extends Table<DBConnection, 'StorageTable'> {
    fileId = this.autogeneratedPrimaryKey('file_id', 'int');
    fileHash = this.column('file_hash', 'string');
    fileType = this.column<FileType>('file_type', 'enum', 'FileType');
    fileMimeType = this.column('file_mime_type', 'string');
    fileDate = this.column<ZonedDateTime>('file_date', 'customComparable', 'dateTime', TemporalTypeAdapter);
    fileData = this.column<Buffer>('file_data', 'custom', 'Blob', BlobTypeAdapter);
    userId = this.optionalColumnWithDefaultValue('user_id', 'int');

    constructor() {
        super('storage');
    }
}


