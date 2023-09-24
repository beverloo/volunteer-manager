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

export class TrainingsTable extends Table<DBConnection, 'TrainingsTable'> {
    trainingId = this.autogeneratedPrimaryKey('training_id', 'int');
    eventId = this.column('event_id', 'int');
    trainingStart = this.columnWithDefaultValue('training_start', 'localDateTime');
    trainingEnd = this.columnWithDefaultValue('training_end', 'localDateTime');
    trainingAddress = this.optionalColumnWithDefaultValue('training_address', 'string');
    trainingCapacity = this.columnWithDefaultValue('training_capacity', 'int');
    trainingVisible = this.columnWithDefaultValue('training_visible', 'int');

    constructor() {
        super('trainings');
    }
}


