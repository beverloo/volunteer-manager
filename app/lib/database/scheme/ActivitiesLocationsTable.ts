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

export class ActivitiesLocationsTable extends Table<DBConnection, 'ActivitiesLocationsTable'> {
    locationId = this.column('location_id', 'int');
    locationFestivalId = this.column('location_festival_id', 'int');
    locationType = this.column<ActivityType>('location_type', 'enum', 'ActivityType');
    locationName = this.column('location_name', 'string');
    locationDisplayName = this.optionalColumnWithDefaultValue('location_display_name', 'string');
    locationAreaId = this.column('location_area_id', 'int');
    locationCreated = this.column<DateTime>('location_created', 'customComparable', 'dateTime', DateTimeTypeAdapter);
    locationUpdated = this.column<DateTime>('location_updated', 'customComparable', 'dateTime', DateTimeTypeAdapter);
    locationDeleted = this.optionalColumnWithDefaultValue<DateTime>('location_deleted', 'customComparable', 'dateTime', DateTimeTypeAdapter);

    constructor() {
        super('activities_locations');
    }
}


