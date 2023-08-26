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

export class UsersSettingsTable extends Table<DBConnection, 'UsersSettingsTable'> {
    userId = this.column('user_id', 'int');
    settingName = this.column('setting_name', 'string');
    settingValue = this.column('setting_value', 'string');

    constructor() {
        super('users_settings');
    }
}


