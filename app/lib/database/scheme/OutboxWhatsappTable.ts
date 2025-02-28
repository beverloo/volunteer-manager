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
    ZonedDateTime,
} from "../../Temporal";

export class OutboxWhatsappTable extends Table<DBConnection, 'OutboxWhatsappTable'> {
    whatsappMessageId = this.autogeneratedPrimaryKey('whatsapp_message_id', 'int');
    whatsappDate = this.columnWithDefaultValue<ZonedDateTime>('whatsapp_date', 'customLocalDateTime', 'dateTime', TemporalTypeAdapter);
    whatsappRecipientUserId = this.column('whatsapp_recipient_user_id', 'int');
    whatsappRecipientPhoneNumber = this.column('whatsapp_recipient_phone_number', 'string');
    whatsappRequest = this.column('whatsapp_request', 'string');
    whatsappErrorName = this.optionalColumnWithDefaultValue('whatsapp_error_name', 'string');
    whatsappErrorMessage = this.optionalColumnWithDefaultValue('whatsapp_error_message', 'string');
    whatsappErrorStack = this.optionalColumnWithDefaultValue('whatsapp_error_stack', 'string');
    whatsappErrorCause = this.optionalColumnWithDefaultValue('whatsapp_error_cause', 'string');
    whatsappResponseStatus = this.optionalColumnWithDefaultValue('whatsapp_response_status', 'int');
    whatsappResponseTime = this.optionalColumnWithDefaultValue('whatsapp_response_time', 'int');
    whatsappResponseMessageId = this.optionalColumnWithDefaultValue('whatsapp_response_message_id', 'string');
    whatsappResponseMessageStatus = this.optionalColumnWithDefaultValue('whatsapp_response_message_status', 'string');
    whatsappResponseText = this.optionalColumnWithDefaultValue('whatsapp_response_text', 'string');

    constructor() {
        super('outbox_whatsapp');
    }
}

export const tOutboxWhatsapp = new OutboxWhatsappTable();

