// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { type ActionProps, noAccess } from '../../Action';
import { LogSeverity, LogType, Log } from '@lib/Log';
import { Privilege, can } from '@lib/auth/Privileges';
import { getEventBySlug } from '@lib/EventLoader';
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

    // TODO: Hide the booking + AdminHotelBookingDelete
    // TODO: For each assigned volunteer, log AdminHotelAssignVolunteerDelete

    if (false)
        return _foo(request, props);

    return { success: false };
}

async function _foo(request: Request, props: ActionProps): Promise<Response> {
    const event = await getEventBySlug(request.slug);
    if (!event)
        return { success: false };

    const existingAssignment = null;
    if (!existingAssignment)
        return { success: false };

    const affectedRows = 0 /* update visibility */;

    if (!!affectedRows) {
        await Log({
            type: LogType.AdminHotelBookingDelete,
            severity: LogSeverity.Info,
            sourceUser: props.user,
            data: {
                event: event.shortName,
            },
        });

        /**
        const affectedVolunteers = [
            existingAssignment.firstUserId,
            existingAssignment.secondUserId,
            existingAssignment.thirdUserId
        ];

        for (const userId of affectedVolunteers) {
            if (!userId)
                continue;  // this wasn't a volunteer-based assignment

            await Log({
                type: LogType.AdminHotelAssignVolunteerDelete,
                severity: LogSeverity.Warning,
                sourceUser: props.user,
                targetUser: userId,
                data: {
                    event: event.shortName,
                },
            });
        }
        **/
    }

    return { success: !!affectedRows };
}
