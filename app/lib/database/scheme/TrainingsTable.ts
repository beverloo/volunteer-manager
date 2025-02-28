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

export class TrainingsTable extends Table<DBConnection, 'TrainingsTable'> {
    trainingId = this.autogeneratedPrimaryKey('training_id', 'int');
    eventId = this.column('event_id', 'int');
    trainingStart = this.columnWithDefaultValue<ZonedDateTime>('training_start', 'customLocalDateTime', 'dateTime', TemporalTypeAdapter);
    trainingEnd = this.columnWithDefaultValue<ZonedDateTime>('training_end', 'customLocalDateTime', 'dateTime', TemporalTypeAdapter);
    trainingAddress = this.optionalColumnWithDefaultValue('training_address', 'string');
    trainingCapacity = this.columnWithDefaultValue('training_capacity', 'int');
    trainingVisible = this.columnWithDefaultValue('training_visible', 'int');

    constructor() {
        super('trainings');
    }
}

export const tTrainings = new TrainingsTable();

