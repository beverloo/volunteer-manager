// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import type { ActionProps } from '../../Action';
import { LogSeverity, LogType, Log } from '@lib/Log';
import { Privilege } from '@lib/auth/Privileges';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import { getEventBySlug } from '@lib/EventLoader';
import db, { tHotelsBookings } from '@lib/database';

/**
 * Interface definition for the Hotel Booking API, exposed through /api/admin/hotel-bookings.
 */
export const kCreateBookingDefinition = z.object({
    request: z.object({
        /**
         * Slug of the event for which the booking is in scope.
         */
        slug: z.string(),
    }),
    response: z.strictObject({
        /**
         * Unique ID of the booking when it was created successfully.
         */
        id: z.number(),
    }),
});

export type CreateBookingDefinition = z.infer<typeof kCreateBookingDefinition>;

type Request = CreateBookingDefinition['request'];
type Response = CreateBookingDefinition['response'];

/**
 * API to create a new hotel booking within a given scope.
 */
export async function createBooking(request: Request, props: ActionProps): Promise<Response> {
    executeAccessCheck(props.authenticationContext, {
        check: 'admin-event',
        event: request.slug,
        privilege: Privilege.EventHotelManagement,
    });

    const event = await getEventBySlug(request.slug);
    if (!event)
        return { id: /* the event could not be found= */ 0 };

    const insertId = await db.insertInto(tHotelsBookings)
        .set({
            eventId: event.eventId,
            bookingCheckIn: new Date(event.startTime),
            bookingCheckOut: new Date(event.endTime),
            bookingConfirmed: 0,
            bookingVisible: 1,
        })
        .returningLastInsertedId()
        .executeInsert();

    if (!!insertId) {
        await Log({
            type: LogType.AdminHotelBookingCreate,
            severity: LogSeverity.Info,
            sourceUser: props.user,
            data: {
                event: event.shortName,
            },
        })
    }

    return { id: insertId };
}
