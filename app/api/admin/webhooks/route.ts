// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { type DataTableEndpoints, createDataTableApi } from '../../createDataTableApi';
import { Privilege } from '@lib/auth/Privileges';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import db, { tTwilioWebhookCalls } from '@lib/database';

/**
 * Row model for a webhook call received by the Volunteer Manager.
 */
const kWebhookRowModel = z.object({
    /**
     * Unique ID of the call.
     */
    id: z.number(),

    /**
     * Date at which the webhook was received by our server.
     */
    date: z.string(),

    /**
     * The service for which a message was received.
     */
    service: z.string(),

    /**
     * Type of message that was received from the given service.
     */
    type: z.string(),

    /**
     * IP address from which the message was received.
     */
    source: z.string().optional(),

    /**
     * Destination, i.e. where was the webhook sent to?
     */
    destination: z.string(),

    /**
     * Size, in bytes, of the received message.
     */
    size: z.number(),

    /**
     * Whether the message was successfully authenticated.
     */
    authenticated: z.boolean(),
});

/**
 * This API does not require any context.
 */
const kWebhookContext = z.never();

/**
 * Export type definitions so that the API can be used in `callApi()`.
 */
export type WebhookEndpoints =
    DataTableEndpoints<typeof kWebhookRowModel, typeof kWebhookContext>;

/**
 * Export type definition for the API's Row Model.
 */
export type WebhookRowModel = z.infer<typeof kWebhookRowModel>;

/**
 * This is implemented as a regular DataTable API.
 */
export const { GET } = createDataTableApi(kWebhookRowModel, kWebhookContext, {
    async accessCheck(request, action, props) {
        executeAccessCheck(props.authenticationContext, {
            check: 'admin',
            privilege: Privilege.SystemOutboxAccess,
        });
    },

    async list({ pagination, sort }) {
        const dbInstance = db;

        // TODO: Add other webhook sources as unions.
        // https://ts-sql-query.readthedocs.io/en/stable/queries/select/#select-with-a-compound-operator-union-intersect-except
        const data = await dbInstance.selectFrom(tTwilioWebhookCalls)
            .select({
                id: tTwilioWebhookCalls.webhookCallId,
                date: dbInstance.dateTimeAsString(tTwilioWebhookCalls.webhookCallDate),
                service: dbInstance.const('twilio', 'string'),
                type: tTwilioWebhookCalls.webhookCallEndpoint,
                source: tTwilioWebhookCalls.webhookRequestSource,
                destination: tTwilioWebhookCalls.webhookRequestUrl,
                size: tTwilioWebhookCalls.webhookRequestBody.length(),
                authenticated: tTwilioWebhookCalls.webhookRequestAuthenticated.equals(/* true= */ 1)
            })
            .orderBy(sort?.field ?? 'date' as any, sort?.sort ?? 'desc')
            .limitIfValue(pagination?.pageSize)
                .offsetIfValue(pagination ? pagination.page * pagination.pageSize
                                          : undefined)
            .executeSelectPage();

        return {
            success: true,
            rowCount: data.count,
            rows: data.data,
        };
    },
});

export const dynamic = 'force-dynamic';
