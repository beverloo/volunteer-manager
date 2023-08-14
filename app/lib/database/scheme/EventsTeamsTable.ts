/* eslint-disable quotes */
/**
 * DO NOT EDIT:
 *
 * This file has been auto-generated from database schema using ts-sql-codegen.
 * Any changes will be overwritten.
 */
import { Table } from "ts-sql-query/Table";
import type { DBConnection } from "../Connection";

export class EventsTeamsTable extends Table<DBConnection, 'EventsTeamsTable'> {
    eventId = this.column('event_id', 'int');
    teamId = this.column('team_id', 'int');
    enableContent = this.columnWithDefaultValue('enable_content', 'int');
    enableRegistration = this.columnWithDefaultValue('enable_registration', 'int');
    enableSchedule = this.columnWithDefaultValue('enable_schedule', 'int');

    constructor() {
        super('events_teams');
    }
}


