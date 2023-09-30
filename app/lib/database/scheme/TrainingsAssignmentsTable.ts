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

export class TrainingsAssignmentsTable extends Table<DBConnection, 'TrainingsAssignmentsTable'> {
    assignmentId = this.autogeneratedPrimaryKey('assignment_id', 'int');
    eventId = this.column('event_id', 'int');
    assignmentUserId = this.optionalColumnWithDefaultValue('assignment_user_id', 'int');
    assignmentExtraId = this.optionalColumnWithDefaultValue('assignment_extra_id', 'int');
    assignmentTrainingId = this.optionalColumnWithDefaultValue('assignment_training_id', 'int');
    assignmentUpdated = this.optionalColumnWithDefaultValue('assignment_updated', 'localDateTime');
    assignmentConfirmed = this.columnWithDefaultValue('assignment_confirmed', 'int');
    preferenceTrainingId = this.optionalColumnWithDefaultValue('preference_training_id', 'int');
    preferenceUpdated = this.optionalColumnWithDefaultValue('preference_updated', 'localDateTime');

    constructor() {
        super('trainings_assignments');
    }
}


