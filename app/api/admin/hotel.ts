// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { type ActionProps, noAccess } from '../Action';
import { Log, LogSeverity, LogType } from '@lib/Log';
import { Privilege, can } from '@lib/auth/Privileges';
import { getEventBySlug } from '@lib/EventLoader';
import db, { tHotels } from '@lib/database';

/**
 * Interface definition for the Hotel API, exposed through /api/admin/hotel.
 */
export const kHotelDefinition = z.object({
    request: z.object({
        /**
         * Slug of the event for which an hotel room is being added.
         */
        event: z.string(),

        /**
         * Must be set to an empty object when a new hotel room is being added.
         */
        create: z.object({ /* empty object */ }).optional(),

        /**
         * Must be set to an object when a hotel room is being deleted.
         */
        delete: z.object({
            /**
             * Unique ID of the hotel room that should be removed.
             */
            id: z.number(),
        }).optional(),

        /**
         * Must be set to an object when a hotel room is being updated.
         */
        update: z.object({
            /**
             * Unique ID of the hotel room that is being updated.
             */
            id: z.number(),

            /**
             * New description of the hotel. Should be a non-empty string.
             */
            hotelDescription: z.string().optional(),

            /**
             * New name of the hotel. Should be a non-empty string.
             */
            hotelName: z.string().optional(),

            /**
             * New name of the room type within the hotel. Should be a non-empty string.
             */
            roomName: z.string().optional(),

            /**
             * New number of people that can stay in the hotel room.
             */
            roomPeople: z.number().optional(),

            /**
             * New price of the hotel room. Free is best, but probably a bug.
             */
            roomPrice: z.number().optional(),

        }).optional(),
    }),
    response: z.strictObject({
        /**
         * Whether the API call was executed successfully.
         */
        success: z.boolean(),

        /**
         * `create`: ID of the new hotel room that was added to the database.
         */
        id: z.number().optional(),
    }),
});

export type HotelDefinition = z.infer<typeof kHotelDefinition>;

type Request = HotelDefinition['request'];
type Response = HotelDefinition['response'];

/**
 * API that allows event administrators to manage hotel rooms on the fly. This API supports rooms
 * to be created, updated and removed all the same.
 */
export async function hotel(request: Request, props: ActionProps): Promise<Response> {
    if (!can(props.user, Privilege.EventHotelManagement))
        noAccess();

    const event = await getEventBySlug(request.event);
    if (!event)
        return { success: false };

    // Operation: create
    if (request.create !== undefined) {
        const insertId =
            await db.insertInto(tHotels)
                .values({ eventId: event.eventId })
                .returningLastInsertedId()
                .executeInsert();

        await Log({
            type: LogType.AdminEventHotelMutation,
            severity: LogSeverity.Info,
            sourceUser: props.user,
            data: {
                eventName: event.shortName,
                mutation: 'Created',
            },
        });

        return { success: true, id: insertId };
    }

    // Operation: delete
    if (request.delete !== undefined) {
        const affectedRows =
            await db.deleteFrom(tHotels)
                .where(tHotels.hotelId.equals(request.delete.id))
                .and(tHotels.eventId.equals(event.eventId))
                .executeDelete(/* min= */ 0, /* max= */ 1);

        if (affectedRows > 0) {
            await Log({
                type: LogType.AdminEventHotelMutation,
                severity: LogSeverity.Info,
                sourceUser: props.user,
                data: {
                    eventName: event.shortName,
                    mutation: 'Deleted',
                },
            });
        }

        return { success: !!affectedRows };
    }

    // Operation: update
    if (request.update !== undefined) {
        const affectedRows = await db.update(tHotels)
            .set({
                hotelName: request.update.hotelName,
                hotelDescription: request.update.hotelDescription,
                hotelRoomName: request.update.roomName,
                hotelRoomPeople: request.update.roomPeople,
                hotelRoomPrice: request.update.roomPrice,
            })
            .where(tHotels.hotelId.equals(request.update.id))
            .and(tHotels.eventId.equals(event.eventId))
            .executeUpdate(/* min= */ 0, /* max= */ 1);

        if (affectedRows > 0) {
            await Log({
                type: LogType.AdminEventHotelMutation,
                severity: LogSeverity.Info,
                sourceUser: props.user,
                data: {
                    eventName: event.shortName,
                    mutation: 'Updated',
                },
            });
        }

        return { success: !!affectedRows };
    }

    return { success: false };
}
