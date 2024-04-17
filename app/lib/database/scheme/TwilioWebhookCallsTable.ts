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
import {
    TwilioWebhookEndpoint,
} from "../Types";

export class TwilioWebhookCallsTable extends Table<DBConnection, 'TwilioWebhookCallsTable'> {
    webhookCallId = this.autogeneratedPrimaryKey('webhook_call_id', 'int');
    webhookCallDate = this.column<ZonedDateTime>('webhook_call_date', 'customLocalDateTime', 'dateTime', TemporalTypeAdapter);
    webhookCallEndpoint = this.column<TwilioWebhookEndpoint>('webhook_call_endpoint', 'enum', 'TwilioWebhookEndpoint');
    webhookRequestSource = this.optionalColumnWithDefaultValue('webhook_request_source', 'string');
    webhookRequestMethod = this.column('webhook_request_method', 'string');
    webhookRequestUrl = this.column('webhook_request_url', 'string');
    webhookRequestHeaders = this.column('webhook_request_headers', 'string');
    webhookRequestBody = this.column('webhook_request_body', 'string');
    webhookRequestSignature = this.optionalColumnWithDefaultValue('webhook_request_signature', 'string');
    webhookRequestAuthenticated = this.columnWithDefaultValue('webhook_request_authenticated', 'int');
    webhookMessageSid = this.optionalColumnWithDefaultValue('webhook_message_sid', 'string');
    webhookMessageOriginalSid = this.optionalColumnWithDefaultValue('webhook_message_original_sid', 'string');
    webhookErrorName = this.optionalColumnWithDefaultValue('webhook_error_name', 'string');
    webhookErrorCause = this.optionalColumnWithDefaultValue('webhook_error_cause', 'string');
    webhookErrorMessage = this.optionalColumnWithDefaultValue('webhook_error_message', 'string');
    webhookErrorStack = this.optionalColumnWithDefaultValue('webhook_error_stack', 'string');

    constructor() {
        super('twilio_webhook_calls');
    }
}


