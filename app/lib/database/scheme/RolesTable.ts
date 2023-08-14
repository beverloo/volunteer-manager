/**
 * DO NOT EDIT:
 *
 * This file has been auto-generated from database schema using ts-sql-codegen.
 * Any changes will be overwritten.
 */
import { Table } from "ts-sql-query/Table";
import type { DBConnection } from "../Connection.ts";

export class RolesTable extends Table<DBConnection, 'RolesTable'> {
    roleId = this.primaryKey('role_id', 'int');
    roleName = this.column('role_name', 'string');
    roleAdminAccess = this.columnWithDefaultValue('role_admin_access', 'int');
    roleHotelEligible = this.columnWithDefaultValue('role_hotel_eligible', 'int');

    constructor() {
        super('roles');
    }
}


