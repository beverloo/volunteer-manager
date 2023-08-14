/**
 * DO NOT EDIT:
 *
 * This file has been auto-generated from database schema using ts-sql-codegen.
 * Any changes will be overwritten.
 */
import { Table } from "ts-sql-query/Table";
import type { DBConnection } from "../Connection.ts";

export class ContentTable extends Table<DBConnection, 'ContentTable'> {
    contentId = this.primaryKey('content_id', 'int');
    eventId = this.column('event_id', 'int');
    teamId = this.column('team_id', 'int');
    contentPath = this.column('content_path', 'string');
    contentTitle = this.column('content_title', 'string');
    content = this.column('content', 'string');
    revisionAuthorId = this.column('revision_author_id', 'int');
    revisionDate = this.columnWithDefaultValue('revision_date', 'localDateTime');

    constructor() {
        super('content');
    }
}

