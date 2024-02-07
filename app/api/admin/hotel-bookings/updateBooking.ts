// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import type { ActionProps } from '../../Action';
import type { ApiDefinition, ApiRequest, ApiResponse } from '../../Types';
import { LogSeverity, LogType, Log } from '@lib/Log';
import { Privilege } from '@lib/auth/Privileges';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import { getEventBySlug } from '@lib/EventLoader';
import { getHotelBookings } from '@app/admin/events/[slug]/hotels/HotelBookings';
import db, { tHotelsAssignments, tHotelsBookings, tUsers } from '@lib/database';

import { kTemporalPlainDate } from '@app/api/Types';

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

        /**
         * Names of the people staying in this room. The first occupant is the primary occupant, all
         * others may appear in any order. The API places no limit on the number of occupants.
         */
        occupants: z.array(z.string()),

        /**
         * ID of the hotel room which this booking is for.
         */
        hotelId: z.number().optional(),

        /**
         * Date on which the booking will check in.
         */
        checkIn: kTemporalPlainDate,

        /**
         * Date on which the booking will check out.
         */
        checkOut: kTemporalPlainDate,

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

        /**
         * When successful, the occupants that have been saved to the database.
         */
        occupants: z.array(z.object({
            assignmentId: z.number(),
            primary: z.boolean(),
            name: z.string(),
            userId: z.number().optional(),
            userTeam: z.string().optional(),
        })).optional(),
    }),
});

export type UpdateBookingDefinition = ApiDefinition<typeof kUpdateBookingDefinition>;

/**
 * Returns the list of users who can be identified for the given `occupants`. They don't have to
 * be participating in a particular event, the `getHotelBookings()` function will consider that.
 */
async function identifyUsersForOccupants(occupants: string[]) {
    const users = await db.selectFrom(tUsers)
        .where(tUsers.firstName.concat(' ').concat(tUsers.lastName).in(occupants))
        .select({
            userId: tUsers.userId,
            name: tUsers.firstName.concat(' ').concat(tUsers.lastName)
        })
        .executeSelectMany();

    const usersMap = new Map<string, number>();
    for (const user of users)
        usersMap.set(user.name, user.userId);

    return occupants.map((name, index) => {
        const primary = !index;  // first occupant is the primary one
        return usersMap.has(name) ? { userId: usersMap.get(name)!, primary }
                                  : { name, primary };
    });
}

type Request = ApiRequest<typeof kUpdateBookingDefinition>;
type Response = ApiResponse<typeof kUpdateBookingDefinition>;

/**
 * API to update a hotel booking within a given scope.
 */
export async function updateBooking(request: Request, props: ActionProps): Promise<Response> {
    executeAccessCheck(props.authenticationContext, {
        check: 'admin-event',
        event: request.slug,
        privilege: Privilege.EventHotelManagement,
    });

    const event = await getEventBySlug(request.slug);
    if (!event)
        return { success: false };  // the event does not exist anymore

    const { bookings } = await getHotelBookings(event.eventId, request.id);
    if (!bookings || !bookings.length)
        return { success: false };  // the booking does not exist anymore

    const { occupants } = bookings[0];

    // (1) Update the general information for this hotel room booking.
    const affectedRows = await db.update(tHotelsBookings)
        .set({
            bookingHotelId: request.hotelId,
            bookingCheckIn: request.checkIn,
            bookingCheckOut: request.checkOut,
            bookingConfirmed: request.confirmed ? 1 : 0,
        })
        .where(tHotelsBookings.eventId.equals(event.eventId))
            .and(tHotelsBookings.bookingId.equals(request.id))
        .executeUpdate(/* min= */ 0, /* max= */ 1);

    // (2) Determine changes in the booking. People can be (a) added, (b) removed, and (c) upgraded
    //     or downgraded to/from the primary booking owner.
    const updatedOccupants = await identifyUsersForOccupants(request.occupants);
    const currentOccupants = occupants.map(({ userId, name, primary, assignmentId }) => {
        return userId ? { userId, primary, assignmentId }
                      : { name, primary, assignmentId };
    });

    // Pass 1: Remove occupants that exist equally in both lists.
    for (let currentIndex = 0; currentIndex < currentOccupants.length; ++currentIndex) {
        const currentOccupant = currentOccupants[currentIndex];
        for (let updatedIndex = 0; updatedIndex < updatedOccupants.length; ++updatedIndex) {
            const updatedOccupant = updatedOccupants[updatedIndex];

            if (updatedOccupant.userId !== currentOccupant.userId ||
                    updatedOccupant.name !== currentOccupant.name) {
                continue;
            }

            // Case (2c): User was upgraded or downgraded to/from the primary booking owner.
            if (updatedOccupant.primary !== currentOccupant.primary) {
                await db.update(tHotelsAssignments)
                    .set({
                        assignmentPrimary: updatedOccupant.primary ? 1 : 0
                    })
                    .where(tHotelsAssignments.assignmentId.equals(currentOccupant.assignmentId))
                    .executeUpdate(/* min= */ 0, /* max= */ 1);
            }

            currentOccupants.splice(currentIndex, 1);
            currentIndex--;

            updatedOccupants.splice(updatedIndex, 1);
            updatedIndex--;

            break;
        }
    }

    // Pass 2: Remove assignments that are no longer relevant, i.e. case (2b).
    for (const currentOccupant of currentOccupants) {
        await db.deleteFrom(tHotelsAssignments)
            .where(tHotelsAssignments.assignmentId.equals(currentOccupant.assignmentId))
            .executeDelete(/* min= */ 0, /* max= */ 1);

        await Log({
            type: LogType.AdminHotelAssignVolunteerDelete,
            severity: LogSeverity.Warning,
            sourceUser: props.user,
            targetUser: currentOccupant.userId,
            data: {
                event: event.shortName,
            }
        });
    }

    // Pass 3: Create assignments for the new occupants, i.e. case (2a).
    for (const updatedOccupant of updatedOccupants) {
        await db.insertInto(tHotelsAssignments)
            .set({
                bookingId: request.id,
                eventId: event.id,
                assignmentUserId: updatedOccupant.userId,
                assignmentName: updatedOccupant.name,
                assignmentPrimary: updatedOccupant.primary ? 1 : 0,
            })
            .executeInsert();

        await Log({
            type: LogType.AdminHotelAssignVolunteer,
            severity: LogSeverity.Warning,
            sourceUser: props.user,
            targetUser: updatedOccupant.userId,
            data: {
                event: event.shortName,
            }
        });
    }

    await Log({
        type: LogType.AdminHotelBookingUpdate,
        severity: LogSeverity.Info,
        sourceUser: props.user,
        data: {
            event: event.shortName,
        }
    });

    if (!!affectedRows) {
        const { bookings } = await getHotelBookings(event.eventId, request.id);
        if (bookings && bookings.length > 0)
            return { success: true, occupants: bookings[0].occupants };
    }

    return { success: false };
}
