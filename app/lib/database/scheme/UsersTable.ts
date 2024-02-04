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

export class UsersTable extends Table<DBConnection, 'UsersTable'> {
    userId = this.autogeneratedPrimaryKey('user_id', 'int');
    username = this.optionalColumnWithDefaultValue('username', 'string');
    firstName = this.column('first_name', 'string');
    lastName = this.column('last_name', 'string');
    gender = this.column('gender', 'string');
    birthdate = this.optionalColumnWithDefaultValue<PlainDate>('birthdate', 'customComparable', 'date', TemporalTypeAdapter);
    phoneNumber = this.optionalColumnWithDefaultValue('phone_number', 'string');
    avatarId = this.optionalColumnWithDefaultValue('avatar_id', 'int');
    privileges = this.columnWithDefaultValue('privileges', 'bigint');
    challenge = this.optionalColumnWithDefaultValue('challenge', 'string');
    activated = this.columnWithDefaultValue('activated', 'int');
    sessionToken = this.columnWithDefaultValue('session_token', 'int');

    constructor() {
        super('users');
    }
}


