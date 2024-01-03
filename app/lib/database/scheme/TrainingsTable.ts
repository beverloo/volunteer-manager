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
    DateTime,
} from "../../DateTime";

export class TrainingsTable extends Table<DBConnection, 'TrainingsTable'> {
    trainingId = this.autogeneratedPrimaryKey('training_id', 'int');
    eventId = this.column('event_id', 'int');
    trainingStart = this.columnWithDefaultValue<DateTime>('training_start', 'customComparable', 'dateTime', DateTimeTypeAdapter);
    trainingEnd = this.columnWithDefaultValue<DateTime>('training_end', 'customComparable', 'dateTime', DateTimeTypeAdapter);
    trainingAddress = this.optionalColumnWithDefaultValue('training_address', 'string');
    trainingCapacity = this.columnWithDefaultValue('training_capacity', 'int');
    trainingVisible = this.columnWithDefaultValue('training_visible', 'int');

    constructor() {
        super('trainings');
    }
}


