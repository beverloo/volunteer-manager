// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound, unauthorized } from 'next/navigation';
import { z } from 'zod/v4';

import type { ActionProps } from '../../Action';
import type { ApiDefinition, ApiRequest, ApiResponse } from '../../Types';
import { FavouriteCache } from './FavouriteCache';
import { getEventBySlug } from '@lib/EventLoader';
import db, { tUsersEventsFavourites } from '@lib/database';

/**
 * Interface definition for the Schedule API, exposed through /api/event/schedule/favourites
 */
export const kUpdateFavouriteDefinition = z.object({
    request: z.object({
        /**
         * Unique slug of the event to which the help request belongs.
         */
        event: z.string(),

        /**
         * Unique ID of the activity of which the favourited status should be updated.
         */
        activityId: z.string(),
    }),
    response: z.strictObject({
        /**
         * Whether the feedback was submitted successfully.
         */
        success: z.boolean(),

        /**
         * Error message when something went wrong. Will be presented to the user.
         */
        error: z.string().optional(),

        /**
         * Whether the event has now been favourited, for which the server is authoritative.
         */
        favourited: z.boolean().optional(),
    }),
});

export type UpdateFavouriteDefinition = ApiDefinition<typeof kUpdateFavouriteDefinition>;

type Request = ApiRequest<typeof kUpdateFavouriteDefinition>;
type Response = ApiResponse<typeof kUpdateFavouriteDefinition>;

/**
 * API through which a volunteer is able to update their favourite events.
 */
export async function updateFavourite(request: Request, props: ActionProps): Promise<Response> {
    if (!props.user || !props.authenticationContext.user)
        unauthorized();

    const activityId = parseInt(request.activityId, /* radix= */ 10);
    if (!Number.isSafeInteger(activityId))
        notFound();

    const event = await getEventBySlug(request.event);
    if (!event)
        notFound();

    const dbInstance = db;

    const activities = await FavouriteCache.read(dbInstance, event.id, props.user.id);

    let favourited: boolean;

    if (activities.hasOwnProperty(request.activityId)) {
        await dbInstance.deleteFrom(tUsersEventsFavourites)
            .where(tUsersEventsFavourites.userId.equals(props.user.id))
                .and(tUsersEventsFavourites.eventId.equals(event.id))
                .and(tUsersEventsFavourites.activityId.equals(activityId))
            .executeDelete();

        favourited = false;

    } else {
        await dbInstance.insertInto(tUsersEventsFavourites)
            .set({
                userId: props.user.id,
                eventId: event.id,
                activityId,
            })
            .onConflictDoNothing()
            .executeInsert();

        favourited = true;
    }

    FavouriteCache.clear(event.id, props.user.id);

    return {
        success: true,
        favourited,
    };
}
