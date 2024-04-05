// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { type DataTableEndpoints, createDataTableApi } from '../../../createDataTableApi';
import { LogSeverity, SubscriptionType } from '@lib/database/Types';
import { LogType, Log } from '@lib/Log';
import { Privilege } from '@lib/auth/Privileges';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import db, { tSubscriptions, tTeams, tUsers } from '@lib/database';

/**
 * Row model for a subscription.
 */
const kSubscriptionRowModel = z.object({
    /**
     * Unique ID of the subscription row, referring to its representation in the database.
     */
    id: z.string(),

    /**
     * Name of the volunteer who can have subscriptions.
     */
    name: z.string(),

    /**
     * Optional description to render in the "description" column.
     */
    description: z.string().optional(),

    /**
     * Type of subscription that this row is dealing with.
     */
    type: z.nativeEnum(SubscriptionType).optional(),

    /**
     * Whether notifications for this subscription will be delivered by e-mail.
     */
    channelEmail: z.boolean().optional(),

    /**
     * Whether notifications for this subscription will be delivered as a Web Push Notification.
     */
    channelNotification: z.boolean().optional(),

    /**
     * Whether notifications for this subscription will be delivered using WhatsApp.
     */
    channelWhatsapp: z.boolean().optional(),
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
 * Returns a comprehensive list of the subscription types that are available within the portal.
 */
async function getSubscriptionTypes() {
    const teams = await db.selectFrom(tTeams)
        .select({
            id: tTeams.teamId,
            name: tTeams.teamName,
        })
        .orderBy('name', 'asc')
        .executeSelectMany();

    return [
        ...teams.map(team => ({
            type: SubscriptionType.Application,
            typeId: team.id,
            label: `Application (${team.name})`,
        })),
        { type: SubscriptionType.Registration, typeId: null, label: 'New user registrations' },
    ];
}

/**
 * The Subscription API is implemented as a regular, editable DataTable API. All operations are only
 * available to people with the SystemSubscriptionManagement privilege.
 */
export const { GET, PUT } =
createDataTableApi(kSubscriptionRowModel, kSubscriptionContext, {
    accessCheck(request, action, props) {
        executeAccessCheck(props.authenticationContext, {
            check: 'admin',
            privilege: Privilege.SystemSubscriptionManagement,
        });
    },

    async list(context, props) {
        const subscriptionTypes = await getSubscriptionTypes();
        const subscriptionsJoin = tSubscriptions.forUseInLeftJoin();

        const dbInstance = db;
        const volunteers = await dbInstance.selectFrom(tUsers)
            .leftJoin(subscriptionsJoin)
                .on(subscriptionsJoin.subscriptionUserId.equals(tUsers.userId))
            .where(tUsers.privileges.greaterOrEquals(1n))
                .and(tUsers.activated.equals(/* true= */ 1))
            .select({
                id: tUsers.userId,
                name: tUsers.name,

                subscriptions: dbInstance.aggregateAsArray({
                    id: subscriptionsJoin.subscriptionId,
                    type: subscriptionsJoin.subscriptionType,
                    typeId: subscriptionsJoin.subscriptionTypeId,
                    channelEmail: subscriptionsJoin.subscriptionChannelEmail.equals(1),
                    channelNotification:
                        subscriptionsJoin.subscriptionChannelNotification.equals(1),
                    channelWhatsapp: subscriptionsJoin.subscriptionChannelWhatsapp.equals(1),
                }),
            })
            .groupBy(tUsers.userId)
            .orderBy('name', 'asc')
            .executeSelectMany();

        const subscriptions: SubscriptionsRowModel[] = [];
        for (const volunteer of volunteers) {
            const subscriptionCount = volunteer.subscriptions.length;
            const subscriptionDescription =
                `${subscriptionCount} subscription${subscriptionCount === 1 ? '' : 's'}`;

            subscriptions.push({
                id: `${volunteer.id}`,
                name: volunteer.name,
                description: subscriptionDescription,
            });

            for (const { type, typeId, label } of subscriptionTypes) {
                let channelEmail: boolean = false;
                let channelNotification: boolean = false;
                let channelWhatsapp: boolean = false;

                for (const subscription of volunteer.subscriptions) {
                    if (subscription.type !== type || subscription.typeId !== typeId)
                        continue;  // irrelevant subscription
console.log('xxxx');
                    channelEmail ||= subscription.channelEmail;
                    channelNotification ||= subscription.channelNotification;
                    channelWhatsapp ||= subscription.channelWhatsapp;
                }

                subscriptions.push({
                    id: `${volunteer.id}/${type}/${typeId}`,
                    name: label,
                    type: type,
                    channelEmail,
                    channelNotification,
                    channelWhatsapp,
                });
            }
        }

        return {
            success: true,
            rowCount: subscriptions.length,
            rows: subscriptions,
        };
    },

    async update({ row }, props) {
        return { success: false };
    },

    async writeLog({ id }, mutation, props) {
        return;
    },
});
