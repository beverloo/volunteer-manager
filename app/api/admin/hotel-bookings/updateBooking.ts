// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { type ActionProps, noAccess } from '../../Action';
import { LogSeverity, LogType, Log } from '@lib/Log';
import { Privilege, can } from '@lib/auth/Privileges';
import { getEventBySlug } from '@lib/EventLoader';
import db, { tHotelsBookings } from '@lib/database';

/**
 * Interface definition for the Hotel Booking API, exposed through /api/admin/hotel-bookings.
 */
export const kUpdateBookingDefinition = z.object({
    request: z.object({
        /**
         * Slug of the event for which the booking is in scope.
         */
        slug: z.string(),

        /**
         * Unique ID of the hotel booking that's being updated.
         */
        id: z.coerce.number(),

        // TODO: firstName
        // TODO: secondName
        // TODO: thirdName

        /**
         * ID of the hotel room which this booking is for.
         */
        hotelId: z.number().optional(),

        /**
         * Date on which the booking will check in.
         */
        checkIn: z.string().regex(/^[1|2](\d{3})\-(\d{2})-(\d{2})$/),

        /**
         * Date on which the booking will check out.
         */
        checkOut: z.string().regex(/^[1|2](\d{3})\-(\d{2})-(\d{2})$/),

        /**
         * Whether the booking has been confirmed.
         */
        confirmed: z.boolean(),

    }),
    response: z.strictObject({
        /**
         * Whether the updated hotel room booking could successfully be saved.
         */
        success: z.boolean(),
    }),
});

export type UpdateBookingDefinition = z.infer<typeof kUpdateBookingDefinition>;

type Request = UpdateBookingDefinition['request'];
type Response = UpdateBookingDefinition['response'];

/**
 * API to update a hotel booking within a given scope.
 */
export async function updateBooking(request: Request, props: ActionProps): Promise<Response> {
    if (!can(props.user, Privilege.EventHotelManagement))
        noAccess();

    const event = await getEventBySlug(request.slug);
    if (!event)
        return { success: false };

    const affectedRows = await db.update(tHotelsBookings)
        .set({
            bookingHotelId: request.hotelId,
            bookingCheckIn: new Date(request.checkIn),
            bookingCheckOut: new Date(request.checkOut),
            bookingConfirmed: request.confirmed ? 1 : 0,
        })
        .where(tHotelsBookings.eventId.equals(event.eventId))
            .and(tHotelsBookings.bookingId.equals(request.id))
        .executeUpdate(/* min= */ 0, /* max= */ 1);

    // TODO: Log AdminHotelBookingUpdate
    // TODO: Log AdminHotelAssignVolunteer
    // TODO: Log AdminHotelAssignVolunteerDelete

    return { success: !!affectedRows };
}
