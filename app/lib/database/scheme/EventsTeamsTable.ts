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

export class EventsTeamsTable extends Table<DBConnection, 'EventsTeamsTable'> {
    eventId = this.column('event_id', 'int');
    teamId = this.column('team_id', 'int');
    teamTargetSize = this.column('team_target_size', 'int');
    enableTeam = this.columnWithDefaultValue('enable_team', 'int');
    enableContent = this.columnWithDefaultValue('enable_content', 'int');
    enableRegistration = this.columnWithDefaultValue('enable_registration', 'int');
    enableAvailability = this.column('enable_availability', 'int');
    enableSchedule = this.columnWithDefaultValue('enable_schedule', 'int');
    whatsappLink = this.optionalColumnWithDefaultValue('whatsapp_link', 'string');

    constructor() {
        super('events_teams');
    }
}


