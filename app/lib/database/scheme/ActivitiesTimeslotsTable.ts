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
    ActivityType,
} from "../Types";

export class ActivitiesTimeslotsTable extends Table<DBConnection, 'ActivitiesTimeslotsTable'> {
    activityId = this.column('activity_id', 'int');
    timeslotId = this.column('timeslot_id', 'int');
    timeslotType = this.column<ActivityType>('timeslot_type', 'enum', 'ActivityType');
    timeslotStartTime = this.column('timeslot_start_time', 'localDateTime');
    timeslotEndTime = this.column('timeslot_end_time', 'localDateTime');
    timeslotLocationId = this.column('timeslot_location_id', 'int');
    timeslotCreated = this.column('timeslot_created', 'localDateTime');
    timeslotUpdated = this.column('timeslot_updated', 'localDateTime');
    timeslotDeleted = this.optionalColumnWithDefaultValue('timeslot_deleted', 'localDateTime');

    constructor() {
        super('activities_timeslots');
    }
}


