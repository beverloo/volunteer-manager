/**
 * DO NOT EDIT:
 *
 * This file has been auto-generated from database schema using ts-sql-codegen.
 * Any changes will be overwritten.
 */
import { Table } from "ts-sql-query/Table";
import type { DBConnection } from "../Connection.ts";

export class UsersAuthTable extends Table<DBConnection, 'UsersAuthTable'> {
    userId = this.column('user_id', 'int');
    authValue = this.column('auth_value', 'string');

    constructor() {
        super('users_auth');
    }
}


