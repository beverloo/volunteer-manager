// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { type DataTableEndpoints, createDataTableApi } from '../../../createDataTableApi';
import { LogSeverity } from '@lib/database/Types';
import { LogType, Log } from '@lib/Log';
import { Privilege } from '@lib/auth/Privileges';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import db, { tSubscriptions, tUsers } from '@lib/database';

/**
 * Row model for a subscription.
 */
const kSubscriptionRowModel = z.object({
    /**
     * Unique ID of the subscription, as it exists in the database.
     */
    id: z.number(),
});

/**
 * The subscription API does not require any context.
 */
const kSubscriptionContext = z.never();

/**
 * Export type definitions so that the API can be used in `callApi()`.
 */
export type SubscriptionsEndpoints =
    DataTableEndpoints<typeof kSubscriptionRowModel, typeof kSubscriptionContext>;

/**
 * Export type definition for the API's Row Model.
 */
export type SubscriptionsRowModel = z.infer<typeof kSubscriptionRowModel>;

/**
 * The Subscription API is implemented as a regular, editable DataTable API. All operations are only
 * available to people with the SystemSubscriptionManagement privilege.
 */
export const { DELETE, GET, POST, PUT } =
createDataTableApi(kSubscriptionRowModel, kSubscriptionContext, {
    accessCheck(request, action, props) {
        executeAccessCheck(props.authenticationContext, {
            check: 'admin',
            privilege: Privilege.SystemSubscriptionManagement,
        });
    },

    async create({ row }, props) {
        return { success: false };
    },

    async delete({ id }) {
        return { success: false };
    },

    async list(context, props) {
        return { success: false };
    },

    async update({ row }, props) {
        return { success: false };
    },

    async writeLog({ id }, mutation, props) {
        return;
    },
});
