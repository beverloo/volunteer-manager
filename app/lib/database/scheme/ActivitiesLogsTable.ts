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
    Mutation,
    MutationSeverity,
} from "../Types";
import {
    DateTime,
} from "../../DateTime";

export class ActivitiesLogsTable extends Table<DBConnection, 'ActivitiesLogsTable'> {
    festivalId = this.column('festival_id', 'int');
    activityId = this.optionalColumnWithDefaultValue('activity_id', 'int');
    timeslotId = this.optionalColumnWithDefaultValue('timeslot_id', 'int');
    locationId = this.optionalColumnWithDefaultValue('location_id', 'int');
    mutation = this.column<Mutation>('mutation', 'enum', 'Mutation');
    mutationFields = this.optionalColumnWithDefaultValue('mutation_fields', 'string');
    mutationSeverity = this.column<MutationSeverity>('mutation_severity', 'enum', 'MutationSeverity');
    mutationDate = this.column<DateTime>('mutation_date', 'customComparable', 'dateTime', DateTimeTypeAdapter);

    constructor() {
        super('activities_logs');
    }
}


