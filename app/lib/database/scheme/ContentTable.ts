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

export class ContentTable extends Table<DBConnection, 'ContentTable'> {
    contentId = this.autogeneratedPrimaryKey('content_id', 'int');
    eventId = this.column('event_id', 'int');
    teamId = this.column('team_id', 'int');
    contentPath = this.column('content_path', 'string');
    contentTitle = this.column('content_title', 'string');
    contentProtected = this.columnWithDefaultValue('content_protected', 'int');
    content = this.column('content', 'string');
    revisionAuthorId = this.column('revision_author_id', 'int');
    revisionDate = this.columnWithDefaultValue<ZonedDateTime>('revision_date', 'customComparable', 'timestamp', TemporalTypeAdapter);
    revisionVisible = this.columnWithDefaultValue('revision_visible', 'int');

    constructor() {
        super('content');
    }
}


