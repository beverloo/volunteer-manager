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

export class WhatsappMessagesTable extends Table<DBConnection, 'WhatsappMessagesTable'> {
    whatsappMessageId = this.autogeneratedPrimaryKey('whatsapp_message_id', 'int');
    whatsappMessageDate = this.columnWithDefaultValue<ZonedDateTime>('whatsapp_message_date', 'customComparable', 'dateTime', TemporalTypeAdapter);
    whatsappMessageRecipientUserId = this.column('whatsapp_message_recipient_user_id', 'int');
    whatsappMessageRecipientPhoneNumber = this.column('whatsapp_message_recipient_phone_number', 'string');
    whatsappMessageRequest = this.column('whatsapp_message_request', 'string');
    whatsappMessageErrorName = this.optionalColumnWithDefaultValue('whatsapp_message_error_name', 'string');
    whatsappMessageErrorMessage = this.optionalColumnWithDefaultValue('whatsapp_message_error_message', 'string');
    whatsappMessageErrorStack = this.optionalColumnWithDefaultValue('whatsapp_message_error_stack', 'string');
    whatsappMessageErrorCause = this.optionalColumnWithDefaultValue('whatsapp_message_error_cause', 'string');
    whatsappMessageResponseTime = this.optionalColumnWithDefaultValue('whatsapp_message_response_time', 'int');

    constructor() {
        super('whatsapp_messages');
    }
}


