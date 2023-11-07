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

export class RefundsTable extends Table<DBConnection, 'RefundsTable'> {
    userId = this.column('user_id', 'int');
    eventId = this.column('event_id', 'int');
    refundTicketNumber = this.optionalColumnWithDefaultValue('refund_ticket_number', 'string');
    refundAccountIban = this.column('refund_account_iban', 'string');
    refundAccountName = this.column('refund_account_name', 'string');
    refundRequested = this.columnWithDefaultValue('refund_requested', 'localDateTime');
    refundConfirmed = this.optionalColumnWithDefaultValue('refund_confirmed', 'localDateTime');

    constructor() {
        super('refunds');
    }
}


