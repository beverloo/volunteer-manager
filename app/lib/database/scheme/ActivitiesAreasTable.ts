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

export class ActivitiesAreasTable extends Table<DBConnection, 'ActivitiesAreasTable'> {
    areaId = this.column('area_id', 'int');
    areaFestivalId = this.column('area_festival_id', 'int');
    areaType = this.column<ActivityType>('area_type', 'enum', 'ActivityType');
    areaName = this.column('area_name', 'string');
    areaCreated = this.column<DateTime>('area_created', 'customComparable', 'dateTime', DateTimeTypeAdapter);
    areaUpdated = this.column<DateTime>('area_updated', 'customComparable', 'dateTime', DateTimeTypeAdapter);
    areaDeleted = this.optionalColumnWithDefaultValue<DateTime>('area_deleted', 'customComparable', 'dateTime', DateTimeTypeAdapter);

    constructor() {
        super('activities_areas');
    }
}


