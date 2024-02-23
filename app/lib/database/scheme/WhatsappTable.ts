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
    WhatsAppChannelApplications,
} from "../Types";

export class WhatsappTable extends Table<DBConnection, 'WhatsappTable'> {
    whatsappId = this.autogeneratedPrimaryKey('whatsapp_id', 'int');
    whatsappUserId = this.column('whatsapp_user_id', 'int');
    whatsappChannelApplications = this.optionalColumnWithDefaultValue<WhatsAppChannelApplications>('whatsapp_channel_applications', 'enum', 'WhatsAppChannelApplications');

    constructor() {
        super('whatsapp');
    }
}

