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

export class HotelsPreferencesTable extends Table<DBConnection, 'HotelsPreferencesTable'> {
    userId = this.column('user_id', 'int');
    eventId = this.column('event_id', 'int');
    teamId = this.column('team_id', 'int');
    hotelId = this.optionalColumnWithDefaultValue('hotel_id', 'int');
    hotelDateCheckIn = this.optionalColumnWithDefaultValue('hotel_date_check_in', 'localDateTime');
    hotelDateCheckOut = this.optionalColumnWithDefaultValue('hotel_date_check_out', 'localDateTime');
    hotelSharingPeople = this.optionalColumnWithDefaultValue('hotel_sharing_people', 'int');
    hotelSharingPreferences = this.optionalColumnWithDefaultValue('hotel_sharing_preferences', 'string');
    hotelPreferencesUpdated = this.columnWithDefaultValue('hotel_preferences_updated', 'localDateTime');

    constructor() {
        super('hotels_preferences');
    }
}

