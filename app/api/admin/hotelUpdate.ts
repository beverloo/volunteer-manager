// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { type ActionProps, noAccess } from '../Action';
import { Log, LogSeverity, LogType } from '@lib/Log';
import { Privilege, can } from '@lib/auth/Privileges';
import { getEventBySlug } from '@app/lib/EventLoader';

import db, { tHotels } from '@lib/database';

/**
 * Interface definition for the Hotel API, exposed through /api/admin/hotel-update. Only event
 * administrators the necessary permission to access this API.
 */
export const kHotelUpdateDefinition = z.object({
    request: z.object({
        /**
         * Slug of the event for which an hotel room is being added.
         */
        event: z.string(),

        /**
         * Unique ID of the hotel room that is being updated.
         */
        id: z.number(),

        /**
         * New description of the hotel. Should be a non-empty string.
         */
        hotelDescription: z.string(),

        /**
         * New name of the hotel. Should be a non-empty string.
         */
        hotelName: z.string(),

        /**
         * New name of the room type within the hotel. Should be a non-empty string.
         */
        roomName: z.string(),

        /**
         * New number of people that can stay in the hotel room.
         */
        roomPeople: z.number(),

        /**
         * New price of the hotel room. Free is best, but probably a bug.
         */
        roomPrice: z.number(),
    }),
    response: z.strictObject({
        /**
         * Whether the update was stored in the database successfully.
         */
        success: z.boolean(),
    }),
});

export type HotelUpdateDefinition = z.infer<typeof kHotelUpdateDefinition>;

type Request = HotelUpdateDefinition['request'];
type Response = HotelUpdateDefinition['response'];

/**
 * API that allows event administrators to
 */
export async function hotelUpdate(request: Request, props: ActionProps): Promise<Response> {
    if (!can(props.user, Privilege.EventAdministrator))
        noAccess();

    const event = await getEventBySlug(request.event);
    if (!event)
        return { success: false };

    const affectedRows = await db.update(tHotels)
        .set({
            hotelName: request.hotelName,
            hotelDescription: request.hotelDescription,
            hotelRoomName: request.roomName,
            hotelRoomPeople: request.roomPeople,
            hotelRoomPrice: request.roomPrice,
        })
        .where(tHotels.hotelId.equals(request.id))
        .and(tHotels.eventId.equals(event.eventId))
        .executeUpdate(/* min= */ 0, /* max= */ 1);

    if (affectedRows > 0) {
        await Log({
            type: LogType.AdminEventHotelUpdate,
            severity: LogSeverity.Info,
            sourceUser: props.user,
            data: { eventId: event.eventId, eventName: event.shortName },
        });
    }

    return { success: !!affectedRows };
}
