/* eslint-disable quotes */
/**
 * DO NOT EDIT:
 *
 * This file has been auto-generated from database schema using ts-sql-codegen.
 * Any changes will be overwritten.
 */
import { Table } from "ts-sql-query/Table";
import type { DBConnection } from "../Connection";

export class EventsTable extends Table<DBConnection, 'EventsTable'> {
    eventId = this.primaryKey('event_id', 'int');
    eventName = this.column('event_name', 'string');
    eventShortName = this.column('event_short_name', 'string');
    eventSlug = this.column('event_slug', 'string');
    eventHidden = this.columnWithDefaultValue('event_hidden', 'int');
    eventStartTime = this.column('event_start_time', 'localDateTime');
    eventEndTime = this.column('event_end_time', 'localDateTime');

    constructor() {
        super('events');
    }
}


