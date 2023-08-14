/**
 * DO NOT EDIT:
 *
 * This file has been auto-generated from database schema using ts-sql-codegen.
 * Any changes will be overwritten.
 */
import { Table } from "ts-sql-query/Table";
import type { DBConnection } from "../Connection.ts";

export class TeamsTable extends Table<DBConnection, 'TeamsTable'> {
    teamId = this.primaryKey('team_id', 'int');
    teamName = this.column('team_name', 'string');
    teamDescription = this.column('team_description', 'string');
    teamEnvironment = this.column('team_environment', 'string');

    constructor() {
        super('teams');
    }
}


