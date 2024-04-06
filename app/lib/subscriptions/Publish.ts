// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Context } from './Driver';
import { SubscriptionType } from '@lib/database/Types';
import db, { tSubscriptions, tSubscriptionsPublications, tUsers } from '@lib/database';

/**
 * Common interface describing the information necessary to execute on a publication.
 */
interface PublicationBase {
    /**
     * The user who committed an action that led to this publication.
     */
    sourceUserId?: | number;
}

/**
 * Interface describing a publication. Strongly typed based on the subscription type.
 */
export type Publication = PublicationBase & (
    { type: SubscriptionType.Application; typeId: number } |
    { type: SubscriptionType.Registration; typeId?: undefined }
);

/**
 * Publishes the given `publication`. This will be done simultaneously across all delivery channels
 * that we support, where the actual distribution will happen asynchronously using our scheduler.
 * This method returns the unique Publication ID, in case a follow-up might be desired.
 */
export async function Publish(publication: Publication): Promise<number> {
    const dbInstance = db;
    const publicationId = await dbInstance.insertInto(tSubscriptionsPublications)
        .set({
            publicationUserId: publication.sourceUserId,
            publicationSubscriptionType: publication.type,
            publicationSubscriptionTypeId: publication.typeId,
            publicationCreated: dbInstance.currentZonedDateTime(),
        })
        .executeInsert();

    const subscriptions = await dbInstance.selectFrom(tSubscriptions)
        .innerJoin(tUsers)
            .on(tUsers.userId.equals(tSubscriptions.subscriptionUserId))
        .where(tSubscriptions.subscriptionType.equals(publication.type))
            .and(tSubscriptions.subscriptionTypeId.equalsIfValue(publication.typeId))
            .and(tUsers.privileges.greaterOrEquals(1n))
        .select({
            user: {
                userId: tSubscriptions.subscriptionUserId,
                fullName: tUsers.displayName.valueWhenNull(
                    tUsers.firstName.concat(' ').concat(tUsers.lastName)),
                shortName: tUsers.displayName.valueWhenNull(tUsers.firstName),
                emailAddress: tUsers.username,
                phoneNumber: tUsers.phoneNumber,
            },
            subscription: {
                channelEmail: tSubscriptions.subscriptionChannelEmail,
                channelNotification: tSubscriptions.subscriptionChannelNotification,
                channelWhatsapp: tSubscriptions.subscriptionChannelWhatsapp,
            },
        })
        .executeSelectMany();

    if (!subscriptions.length)
        return publicationId;

    for (const { user, subscription } of subscriptions) {
        const context: Context = user;
    }

    return publicationId;
}
