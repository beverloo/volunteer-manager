// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { type ActionProps, noAccess } from '../Action';
import { Log, LogSeverity, LogType } from '@lib/Log';
import { Privilege, can } from '@lib/auth/Privileges';
import { getEventBySlug } from '@app/lib/EventLoader';
import { sql } from '@lib/database';

/**
 * Interface definition for the Hotel API, exposed through /api/admin/hotel-delete. Only event
 * administrators the necessary permission to access this API.
 */
export const kHotelDeleteDefinition = z.object({
    request: z.object({
        /**
         * Slug of the event for which an hotel room is being removed.
         */
        event: z.string(),

        /**
         * Unique ID of the hotel room that should be removed.
         */
        id: z.number(),
    }),
    response: z.strictObject({
        /**
         * Whether the hotel room was successfully deleted.
         */
        success: z.boolean(),
    }),
});

export type HotelDeleteDefinition = z.infer<typeof kHotelDeleteDefinition>;

type Request = HotelDeleteDefinition['request'];
type Response = HotelDeleteDefinition['response'];

/**
 * API that allows event administrators to
 */
export async function hotelDelete(request: Request, props: ActionProps): Promise<Response> {
    if (!can(props.user, Privilege.EventAdministrator))
        noAccess();

    const event = await getEventBySlug(request.event);
    if (!event)
        return { success: false };

    const result = await sql`
        UPDATE
            hotels
        SET
            hotels.hotel_room_visible = 0
        WHERE
            hotels.hotel_id = ${request.id} AND
            hotels.event_id = ${event.eventId}`;

    if (result.ok) {
        Log({
            type: LogType.AdminEventHotelDelete,
            severity: LogSeverity.Info,
            sourceUser: props.user,
            data: { eventId: event.eventId, eventName: event.shortName },
        });
    }

    return { success: result.ok };
}
