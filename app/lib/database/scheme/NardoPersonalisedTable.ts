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

export class NardoPersonalisedTable extends Table<DBConnection, 'NardoPersonalisedTable'> {
    nardoPersonalisedId = this.autogeneratedPrimaryKey('nardo_personalised_id', 'int');
    nardoPersonalisedUserId = this.column('nardo_personalised_user_id', 'int');
    nardoPersonalisedDate = this.column<ZonedDateTime>('nardo_personalised_date', 'customLocalDateTime', 'dateTime', TemporalTypeAdapter);
    nardoPersonalisedInput = this.column('nardo_personalised_input', 'string');
    nardoPersonalisedOutput = this.column('nardo_personalised_output', 'string');

    constructor() {
        super('nardo_personalised');
    }
}

export const tNardoPersonalised = new NardoPersonalisedTable();

