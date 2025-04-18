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
    VendorTeam,
    VendorGender,
    ShirtSize,
    ShirtFit,
} from "../Types";
import {
    ZonedDateTime,
} from "../../Temporal";

export class VendorsTable extends Table<DBConnection, 'VendorsTable'> {
    vendorId = this.autogeneratedPrimaryKey('vendor_id', 'int');
    eventId = this.column('event_id', 'int');
    vendorTeam = this.column<VendorTeam>('vendor_team', 'enum', 'VendorTeam');
    vendorFirstName = this.column('vendor_first_name', 'string');
    vendorLastName = this.column('vendor_last_name', 'string');
    vendorRole = this.column('vendor_role', 'string');
    vendorGender = this.column<VendorGender>('vendor_gender', 'enum', 'VendorGender');
    vendorShirtSize = this.optionalColumnWithDefaultValue<ShirtSize>('vendor_shirt_size', 'enum', 'ShirtSize');
    vendorShirtFit = this.optionalColumnWithDefaultValue<ShirtFit>('vendor_shirt_fit', 'enum', 'ShirtFit');
    vendorModified = this.column<ZonedDateTime>('vendor_modified', 'customLocalDateTime', 'dateTime', TemporalTypeAdapter);
    vendorVisible = this.columnWithDefaultValue('vendor_visible', 'int');

    constructor() {
        super('vendors');
    }
}

export const tVendors = new VendorsTable();

