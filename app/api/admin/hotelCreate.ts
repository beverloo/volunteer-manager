// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { type ActionProps, noAccess } from '../Action';
import { Log, LogSeverity, LogType } from '@lib/Log';
import { Privilege, can } from '@lib/auth/Privileges';
import { getEventBySlug } from '@app/lib/EventLoader';
import db, { tHotels } from '@lib/database';

/**
 * Interface definition for the Hotel API, exposed through /api/admin/hotel-create. Only event
 * administrators the necessary permission to access this API.
 */
export const kHotelCreateDefinition = z.object({
    request: z.object({
        /**
         * Slug of the event for which an hotel room is being added.
         */
        event: z.string(),
    }),
    response: z.strictObject({
        /**
         * ID of the newly added hotel room, filled with default information. Will be omitted when
         * a failure was ran in to when creating the new entry.
         */
        id: z.number().optional(),
    }),
});

export type HotelCreateDefinition = z.infer<typeof kHotelCreateDefinition>;

type Request = HotelCreateDefinition['request'];
type Response = HotelCreateDefinition['response'];

/**
 * API that allows event administrators to create new hotel rooms on the fly. The room will be set
 * up with default values, but the frontend will immediately move into edit mode.
 */
export async function hotelCreate(request: Request, props: ActionProps): Promise<Response> {
    if (!can(props.user, Privilege.EventAdministrator))
        noAccess();

    const event = await getEventBySlug(request.event);
    if (!event)
        return { /* failure response */ };

    const insertId =
        await db.insertInto(tHotels)
            .values({ eventId: event.eventId })
            .returningLastInsertedId()
            .executeInsert();

    await Log({
        type: LogType.AdminEventHotelCreate,
        severity: LogSeverity.Info,
        sourceUser: props.user,
        data: { eventId: event.eventId, eventName: event.shortName },
    });

    return { id: insertId };
}
