/**
 * DO NOT EDIT:
 *
 * This file has been auto-generated from database schema using ts-sql-codegen.
 * Any changes will be overwritten.
 */
import { Table } from "ts-sql-query/Table";
import type { DBConnection } from "../Connection.ts";

export class UsersEventsTable extends Table<DBConnection, 'UsersEventsTable'> {
    userId = this.column('user_id', 'int');
    eventId = this.column('event_id', 'int');
    teamId = this.column('team_id', 'int');
    roleId = this.column('role_id', 'int');
    registrationDate = this.column('registration_date', 'localDateTime');
    hotelEligible = this.optionalColumnWithDefaultValue('hotel_eligible', 'int');
    preferenceHours = this.optionalColumnWithDefaultValue('preference_hours', 'int');
    preferenceTimingStart = this.optionalColumnWithDefaultValue('preference_timing_start', 'int');
    preferenceTimingEnd = this.optionalColumnWithDefaultValue('preference_timing_end', 'int');
    preferences = this.optionalColumnWithDefaultValue('preferences', 'string');
    fullyAvailable = this.columnWithDefaultValue('fully_available', 'int');
    includeCredits = this.columnWithDefaultValue('include_credits', 'int');
    includeSocials = this.columnWithDefaultValue('include_socials', 'int');

    constructor() {
        super('users_events');
    }
}

