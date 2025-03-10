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
    EventSalesCategory,
} from "../Types";

export class EventsSalesConfigurationTable extends Table<DBConnection, 'EventsSalesConfigurationTable'> {
    eventId = this.column('event_id', 'int');
    eventSaleType = this.column('event_sale_type', 'string');
    saleCategory = this.optionalColumnWithDefaultValue<EventSalesCategory>('sale_category', 'enum', 'EventSalesCategory');
    saleCategoryLimit = this.optionalColumnWithDefaultValue('sale_category_limit', 'int');
    saleEventId = this.optionalColumnWithDefaultValue('sale_event_id', 'int');

    constructor() {
        super('events_sales_configuration');
    }
}

export const tEventsSalesConfiguration = new EventsSalesConfigurationTable();

