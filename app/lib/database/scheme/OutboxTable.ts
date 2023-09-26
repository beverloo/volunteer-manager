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

export class OutboxTable extends Table<DBConnection, 'OutboxTable'> {
    outboxId = this.autogeneratedPrimaryKey('outbox_id', 'int');
    outboxTimestamp = this.columnWithDefaultValue('outbox_timestamp', 'localDateTime');
    outboxSender = this.column('outbox_sender', 'string');
    outboxSenderUserId = this.optionalColumnWithDefaultValue('outbox_sender_user_id', 'int');
    outboxTo = this.column('outbox_to', 'string');
    outboxToUserId = this.optionalColumnWithDefaultValue('outbox_to_user_id', 'int');
    outboxCc = this.optionalColumnWithDefaultValue('outbox_cc', 'string');
    outboxBcc = this.optionalColumnWithDefaultValue('outbox_bcc', 'string');
    outboxHeaders = this.optionalColumnWithDefaultValue('outbox_headers', 'string');
    outboxSubject = this.column('outbox_subject', 'string');
    outboxBodyHtml = this.columnWithDefaultValue('outbox_body_html', 'string');
    outboxBodyText = this.columnWithDefaultValue('outbox_body_text', 'string');
    outboxLogs = this.optionalColumnWithDefaultValue('outbox_logs', 'string');
    outboxErrorName = this.optionalColumnWithDefaultValue('outbox_error_name', 'string');
    outboxErrorCause = this.optionalColumnWithDefaultValue('outbox_error_cause', 'string');
    outboxErrorMessage = this.optionalColumnWithDefaultValue('outbox_error_message', 'string');
    outboxErrorStack = this.optionalColumnWithDefaultValue('outbox_error_stack', 'string');
    outboxResultMessageId = this.optionalColumnWithDefaultValue('outbox_result_message_id', 'string');
    outboxResultAccepted = this.optionalColumnWithDefaultValue('outbox_result_accepted', 'string');
    outboxResultRejected = this.optionalColumnWithDefaultValue('outbox_result_rejected', 'string');
    outboxResultPending = this.optionalColumnWithDefaultValue('outbox_result_pending', 'string');
    outboxResultResponse = this.optionalColumnWithDefaultValue('outbox_result_response', 'string');

    constructor() {
        super('outbox');
    }
}


