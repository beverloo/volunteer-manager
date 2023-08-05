// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import type { ActionProps } from '../Action';
import { sql } from '@lib/database';

/**
 * Interface definition for the Hotel API, exposed through /api/event/hotels.
 */
export const kHotelsDefinition = z.object({
    request: z.object({
        /**
         * Unique slug of the event for which to fetch hotel room information.
         */
        event: z.string(),
    }),
    response: z.strictObject({
        /**
         * The hotels which have rooms available for this event.
         */
        hotels: z.array(z.strictObject({
            /**
             * Name of the hotel.
             */
            name: z.string(),

            /**
             * Description of the hotel. May contain Markdown content.
             */
            description: z.string(),

            /**
             * The hotel rooms that are available in this hotel.
             */
            rooms: z.array(z.strictObject({
                /**
                 * Unique ID of this room in the database.
                 */
                id: z.number(),

                /**
                 * Name of the hotel room.
                 */
                name: z.string(),

                /**
                 * How many people can stay in this hotel room?
                 */
                people: z.number(),

                /**
                 * Price of this hotel room per night, in cents. (I.e. €184.50 would be 18450.)
                 */
                price: z.number(),
            })),
        })),
    }),
});

export type HotelsDefinition = z.infer<typeof kHotelsDefinition>;

type Request = HotelsDefinition['request'];
type Response = HotelsDefinition['response'];

/**
 * API through which visitors can retrieve information about the hotel rooms available for an event.
 * These are the same regardless of volunteering team, but may not be available to everybody.
 */
export async function hotels(request: Request, props: ActionProps): Promise<Response> {
    const result = await sql`
        SELECT
            hotels.hotel_id,
            hotels.hotel_name,
            hotels.hotel_description,
            hotels.hotel_room_name,
            hotels.hotel_room_people,
            hotels.hotel_room_price
        FROM
            events
        LEFT JOIN
            hotels ON hotels.event_id = events.event_id
        WHERE
            events.event_slug = ${request.event} AND
            hotels.hotel_id IS NOT NULL
        ORDER BY
            hotels.hotel_name ASC,
            hotels.hotel_room_people ASC,
            hotels.hotel_room_name ASC`;

    if (result.ok && result.rows.length > 0) {
        const hotels = new Map<string, Response['hotels'][number]>();
        for (const row of result.rows) {
            if (!hotels.has(row.hotel_name)) {
                hotels.set(row.hotel_name, {
                    name: row.hotel_name,
                    description: row.hotel_description,
                    rooms: [ /* to be added */],
                });
            }

            hotels.get(row.hotel_name)!.rooms.push({
                id: row.hotel_id,
                name: row.hotel_room_name,
                people: row.hotel_room_people,
                price: row.hotel_room_price,
            });
        }

        return { hotels: [ ...hotels.values() ] };
    }

    return { hotels: [ /* no data */ ] };
}
