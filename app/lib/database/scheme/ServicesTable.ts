/* eslint-disable quotes, max-len */
/**
 * DO NOT EDIT:
 *
 * This file has been auto-generated from database schema using ts-sql-codegen.
 * Any changes will be overwritten.
 */
import { Table } from "ts-sql-query/Table";
import type { DBConnection } from "../Connection";

export class ServicesTable extends Table<DBConnection, 'ServicesTable'> {
    serviceId = this.autogeneratedPrimaryKey('service_id', 'int');
    serviceName = this.column('service_name', 'string');
    serviceEventId = this.column('service_event_id', 'int');
    serviceEnabled = this.column('service_enabled', 'int');
    serviceInterval = this.column('service_interval', 'int');
    serviceDriver = this.column('service_driver', 'string');
    serviceParams = this.column('service_params', 'string');

    constructor() {
        super('services');
    }
}


