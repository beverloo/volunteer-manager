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

export class ShiftsTable extends Table<DBConnection, 'ShiftsTable'> {
    shiftId = this.autogeneratedPrimaryKey('shift_id', 'int');
    shiftIdentifier = this.column('shift_identifier', 'string');
    eventId = this.column('event_id', 'int');
    teamId = this.column('team_id', 'int');
    shiftCategoryId = this.column('shift_category_id', 'int');
    shiftName = this.column('shift_name', 'string');
    shiftActivityId = this.optionalColumnWithDefaultValue('shift_activity_id', 'int');
    shiftAreaId = this.optionalColumnWithDefaultValue('shift_area_id', 'int');
    shiftLocationId = this.optionalColumnWithDefaultValue('shift_location_id', 'string');
    shiftLocationName = this.optionalColumnWithDefaultValue('shift_location_name', 'string');
    shiftDemand = this.optionalColumnWithDefaultValue('shift_demand', 'string');
    shiftExcitement = this.column('shift_excitement', 'double');
    shiftDeleted = this.optionalColumnWithDefaultValue<ZonedDateTime>('shift_deleted', 'customLocalDateTime', 'dateTime', TemporalTypeAdapter);

    constructor() {
        super('shifts');
    }
}


