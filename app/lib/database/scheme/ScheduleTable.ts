/**
 * DO NOT EDIT:
 *
 * This file has been auto-generated from database schema using ts-sql-codegen.
 * Any changes will be overwritten.
 */
import { Table } from "ts-sql-query/Table";
import type { DBConnection } from "../Connection.ts";

export class ScheduleTable extends Table<DBConnection, 'ScheduleTable'> {
    scheduleId = this.primaryKey('schedule_id', 'int');
    userId = this.column('user_id', 'int');
    eventId = this.column('event_id', 'int');
    shiftId = this.optionalColumnWithDefaultValue('shift_id', 'int');
    scheduleTimeStart = this.column('schedule_time_start', 'localDateTime');
    scheduleTimeEnd = this.column('schedule_time_end', 'localDateTime');

    constructor() {
        super('schedule');
    }
}


