/**
 * DO NOT EDIT:
 *
 * This file has been auto-generated from database schema using ts-sql-codegen.
 * Any changes will be overwritten.
 */
import { Table } from "ts-sql-query/Table";
import type { DBConnection } from "../Connection.ts";

export class ShiftsTable extends Table<DBConnection, 'ShiftsTable'> {
    shiftId = this.primaryKey('shift_id', 'int');
    shiftIdentifier = this.column('shift_identifier', 'string');
    eventId = this.column('event_id', 'int');
    teamId = this.column('team_id', 'int');
    shiftName = this.column('shift_name', 'string');
    shiftProgramId = this.optionalColumnWithDefaultValue('shift_program_id', 'int');
    shiftAreaId = this.optionalColumnWithDefaultValue('shift_area_id', 'int');
    shiftLocationId = this.optionalColumnWithDefaultValue('shift_location_id', 'string');
    shiftLocationName = this.optionalColumnWithDefaultValue('shift_location_name', 'string');
    shiftExcitement = this.column('shift_excitement', 'double');

    constructor() {
        super('shifts');
    }
}

