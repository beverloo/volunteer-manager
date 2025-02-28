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
    SubscriptionType,
} from "../Types";
import {
    ZonedDateTime,
} from "../../Temporal";

export class SubscriptionsPublicationsTable extends Table<DBConnection, 'SubscriptionsPublicationsTable'> {
    publicationId = this.autogeneratedPrimaryKey('publication_id', 'int');
    publicationUserId = this.optionalColumnWithDefaultValue('publication_user_id', 'int');
    publicationSubscriptionType = this.column<SubscriptionType>('publication_subscription_type', 'enum', 'SubscriptionType');
    publicationSubscriptionTypeId = this.optionalColumnWithDefaultValue('publication_subscription_type_id', 'int');
    publicationCreated = this.column<ZonedDateTime>('publication_created', 'customLocalDateTime', 'dateTime', TemporalTypeAdapter);

    constructor() {
        super('subscriptions_publications');
    }
}

export const tSubscriptionsPublications = new SubscriptionsPublicationsTable();

