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
    trainingDate = this.columnWithDefaultValue('training_date', 'localDateTime');
    trainingCapacity = this.columnWithDefaultValue('training_capacity', 'int');
    trainingLeadUserId = this.optionalColumnWithDefaultValue('training_lead_user_id', 'int');
    trainingVisible = this.columnWithDefaultValue('training_visible', 'int');

    constructor() {
        super('trainings');
    }
}


