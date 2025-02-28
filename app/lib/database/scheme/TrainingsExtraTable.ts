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
    PlainDate,
} from "../../Temporal";

export class TrainingsExtraTable extends Table<DBConnection, 'TrainingsExtraTable'> {
    trainingExtraId = this.autogeneratedPrimaryKey('training_extra_id', 'int');
    eventId = this.column('event_id', 'int');
    trainingExtraName = this.columnWithDefaultValue('training_extra_name', 'string');
    trainingExtraEmail = this.columnWithDefaultValue('training_extra_email', 'string');
    trainingExtraBirthdate = this.optionalColumnWithDefaultValue<PlainDate>('training_extra_birthdate', 'customLocalDate', 'date', TemporalTypeAdapter);
    trainingExtraVisible = this.columnWithDefaultValue('training_extra_visible', 'int');

    constructor() {
        super('trainings_extra');
    }
}

export const tTrainingsExtra = new TrainingsExtraTable();

