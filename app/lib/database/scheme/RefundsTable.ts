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
    TemporalTypeAdapter,
} from "../TemporalTypeAdapter";
import {
    DateTime,
} from "../../DateTime";
import {
    ZonedDateTime,
} from "../../Temporal";

export class RefundsTable extends Table<DBConnection, 'RefundsTable'> {
    userId = this.column('user_id', 'int');
    eventId = this.column('event_id', 'int');
    refundTicketNumber = this.optionalColumnWithDefaultValue('refund_ticket_number', 'string');
    refundAccountIban = this.column('refund_account_iban', 'string');
    refundAccountName = this.column('refund_account_name', 'string');
    refundRequested = this.columnWithDefaultValue<DateTime>('refund_requested', 'customComparable', 'dateTime', DateTimeTypeAdapter);
    refundConfirmed = this.optionalColumnWithDefaultValue<ZonedDateTime>('refund_confirmed', 'customComparable', 'dateTime', TemporalTypeAdapter);

    constructor() {
        super('refunds');
    }
}


