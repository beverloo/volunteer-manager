// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { type ActionProps, noAccess } from '../../Action';
import { LogSeverity, LogType, Log } from '@lib/Log';
import { Privilege, can } from '@lib/auth/Privileges';
import { getEventBySlug } from '@lib/EventLoader';
import { getHotelBookings } from '@app/admin/events/[slug]/hotels/HotelBookings';
import db, { tHotelsAssignments, tHotelsBookings } from '@lib/database';

/**
 * Interface definition for the Hotel Booking API, exposed through /api/admin/hotel-bookings.
 */
export const kDeleteBookingDefinition = z.object({
    request: z.object({
        /**
         * Slug of the event for which the booking is in scope.
         */
        slug: z.string(),

        /**
         * Unique ID of the hotel booking that's being deleted.
         */
        id: z.coerce.number(),

    }),
    response: z.strictObject({
        /**
         * Whether the hotel room booking could successfully be deleted.
         */
        success: z.boolean(),
    }),
});

export type DeleteBookingDefinition = z.infer<typeof kDeleteBookingDefinition>;

type Request = DeleteBookingDefinition['request'];
type Response = DeleteBookingDefinition['response'];

/**
 * API to delete a hotel booking within a given scope.
 */
export async function deleteBooking(request: Request, props: ActionProps): Promise<Response> {
    if (!can(props.user, Privilege.EventHotelManagement))
        noAccess();

    const event = await getEventBySlug(request.slug);
    if (!event)
        return { success: false };

    const { bookings } = await getHotelBookings(event.eventId, request.id);
    if (!bookings || !bookings.length)
        return { success: false };  // the booking does not exist anymore

    const { occupants } = bookings[0];

    // Step (1): Delete the booking from the database, i.e. mark it as invisible.
    const affectedRows = await db.update(tHotelsBookings)
        .set({
            bookingVisible: 0
        })
        .where(tHotelsBookings.bookingId.equals(request.id))
            .and(tHotelsBookings.eventId.equals(event.id))
        .executeUpdate(/* min= */ 0, /* max= */ 1);

    if (!affectedRows)
        return { success: false };

    await Log({
        type: LogType.AdminHotelBookingDelete,
        severity: LogSeverity.Info,
        sourceUser: props.user,
        data: {
            event: event.shortName,
        },
    })

    // Step (2): For each occupying volunteer, log that their assigned hotel room was removed.
    for (const occupant of occupants) {
        if (!occupant.userId)
            continue;  // the occupant is not a volunteer

        await Log({
            type: LogType.AdminHotelAssignVolunteerDelete,
            severity: LogSeverity.Warning,
            sourceUser: props.user,
            targetUser: occupant.userId,
            data: {
                event: event.shortName,
            }
        });
    }

    return { success: true };
}
