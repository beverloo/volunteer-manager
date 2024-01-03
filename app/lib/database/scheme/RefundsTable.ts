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
    DateTimeTypeAdapter,
} from "../DateTimeTypeAdapter";
import {
    DateTime,
} from "../../DateTime";

export class RefundsTable extends Table<DBConnection, 'RefundsTable'> {
    userId = this.column('user_id', 'int');
    eventId = this.column('event_id', 'int');
    refundTicketNumber = this.optionalColumnWithDefaultValue('refund_ticket_number', 'string');
    refundAccountIban = this.column('refund_account_iban', 'string');
    refundAccountName = this.column('refund_account_name', 'string');
    refundRequested = this.columnWithDefaultValue<DateTime>('refund_requested', 'customComparable', 'dateTime', DateTimeTypeAdapter);
    refundConfirmed = this.optionalColumnWithDefaultValue<DateTime>('refund_confirmed', 'customComparable', 'dateTime', DateTimeTypeAdapter);

    constructor() {
        super('refunds');
    }
}


