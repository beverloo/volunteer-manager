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
    ExportType,
} from "../Types";

export class ExportsTable extends Table<DBConnection, 'ExportsTable'> {
    exportId = this.autogeneratedPrimaryKey('export_id', 'int');
    exportSlug = this.column('export_slug', 'string');
    exportEventId = this.column('export_event_id', 'int');
    exportType = this.column<ExportType>('export_type', 'enum', 'ExportType');
    exportJustification = this.column('export_justification', 'string');
    exportCreatedDate = this.column('export_created_date', 'localDateTime');
    exportCreatedUserId = this.column('export_created_user_id', 'int');
    exportExpirationDate = this.column('export_expiration_date', 'localDateTime');
    exportExpirationViews = this.column('export_expiration_views', 'int');
    exportEnabled = this.columnWithDefaultValue('export_enabled', 'int');

    constructor() {
        super('exports');
    }
}

