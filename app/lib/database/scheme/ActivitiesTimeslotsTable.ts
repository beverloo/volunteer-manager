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
    DateTimeTypeAdapter,
} from "../DateTimeTypeAdapter";
import {
    ActivityType,
} from "../Types";
import {
    DateTime,
} from "../../DateTime";

export class ActivitiesTimeslotsTable extends Table<DBConnection, 'ActivitiesTimeslotsTable'> {
    activityId = this.column('activity_id', 'int');
    timeslotId = this.column('timeslot_id', 'int');
    timeslotType = this.column<ActivityType>('timeslot_type', 'enum', 'ActivityType');
    timeslotStartTime = this.column<DateTime>('timeslot_start_time', 'customComparable', 'dateTime', DateTimeTypeAdapter);
    timeslotEndTime = this.column<DateTime>('timeslot_end_time', 'customComparable', 'dateTime', DateTimeTypeAdapter);
    timeslotLocationId = this.column('timeslot_location_id', 'int');
    timeslotCreated = this.column<DateTime>('timeslot_created', 'customComparable', 'dateTime', DateTimeTypeAdapter);
    timeslotUpdated = this.column<DateTime>('timeslot_updated', 'customComparable', 'dateTime', DateTimeTypeAdapter);
    timeslotDeleted = this.optionalColumnWithDefaultValue<DateTime>('timeslot_deleted', 'customComparable', 'dateTime', DateTimeTypeAdapter);

    constructor() {
        super('activities_timeslots');
    }
}


