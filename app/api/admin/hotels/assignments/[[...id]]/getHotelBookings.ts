// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { HotelsAssignmentsRowModel } from './route';
import { RegistrationStatus } from '@lib/database/Types';
import db, { tHotelsAssignments, tHotelsBookings, tHotels, tTeams, tUsersEvents, tUsers } from '@lib/database';

/**
 * Retrieves the hotel bookings for the given `eventId` in line with the row model of hotel
 * assignments. This combines data from various database tables. Optionally the `bookingId` can be
 * specified to limit results to a single booking.
 */
export async function getHotelBookings(eventId: number, bookingId?: number)
    : Promise<HotelsAssignmentsRowModel[]>
{
    const teamsJoin = tTeams.forUseInLeftJoin();
    const usersEventsJoin = tUsersEvents.forUseInLeftJoin();
    const usersJoin = tUsers.forUseInLeftJoin();

    const assignments = await db.selectFrom(tHotelsAssignments)
        .innerJoin(tHotelsBookings)
            .on(tHotelsBookings.bookingId.equals(tHotelsAssignments.bookingId))
            .and(tHotelsBookings.bookingVisible.equals(/* true= */ 1))
        .leftJoin(usersJoin)
            .on(usersJoin.userId.equals(tHotelsAssignments.assignmentUserId))
        .leftJoin(usersEventsJoin)
            .on(usersEventsJoin.eventId.equals(tHotelsAssignments.eventId))
            .and(usersEventsJoin.userId.equals(tHotelsAssignments.assignmentUserId))
            .and(usersEventsJoin.registrationStatus.in(
                [ RegistrationStatus.Accepted, RegistrationStatus.Cancelled ]))
        .leftJoin(teamsJoin)
            .on(teamsJoin.teamId.equals(usersEventsJoin.teamId))
        .where(tHotelsAssignments.eventId.equals(eventId))
            .and(tHotelsAssignments.bookingId.equalsIfValue(bookingId))
        .select({
            bookingId: tHotelsAssignments.bookingId,
            name: tHotelsAssignments.assignmentName.valueWhenNull(
                usersJoin.firstName.concat(' ').concat(usersJoin.lastName)),

            userId: tHotelsAssignments.assignmentUserId,
            team: teamsJoin.teamEnvironment,
        })
        .orderBy(tHotelsAssignments.assignmentPrimary, 'desc')
            .orderBy('name', 'asc')
        .executeSelectMany();

    const assignmentsByBookingId = new Map<number, typeof assignments[number][]>();
    for (const assignment of assignments) {
        if (!assignmentsByBookingId.has(assignment.bookingId))
            assignmentsByBookingId.set(assignment.bookingId, [ assignment ]);
        else
            assignmentsByBookingId.get(assignment.bookingId)!.push(assignment);
    }

    const hotelsJoin = tHotels.forUseInLeftJoin();
    const bookings = await db.selectFrom(tHotelsBookings)
        .leftJoin(hotelsJoin)
            .on(hotelsJoin.hotelId.equals(tHotelsBookings.bookingHotelId))
        .where(tHotelsBookings.eventId.equals(eventId))
            .and(tHotelsBookings.bookingId.equalsIfValue(bookingId))
            .and(tHotelsBookings.bookingVisible.equals(/* true= */ 1))
        .select({
            id: tHotelsBookings.bookingId,

            hotelId: tHotelsBookings.bookingHotelId,
            hotelName: hotelsJoin.hotelName,
            hotelRoomName: hotelsJoin.hotelRoomName,
            hotelVisible: hotelsJoin.hotelRoomVisible,

            checkIn: tHotelsBookings.bookingCheckInString,
            checkOut: tHotelsBookings.bookingCheckOutString,
            confirmed: tHotelsBookings.bookingConfirmed,
        })
        .orderBy('confirmed', 'desc')
            .orderBy('checkIn', 'asc')
            .orderBy('checkOut', 'asc')
            .orderBy('id', 'asc')
        .executeSelectMany();

    return bookings.map(booking => {
        const assignments = assignmentsByBookingId.get(booking.id) ?? [];
        return {
            id: booking.id,
            firstName: assignments[0]?.name,
            firstUserId: assignments[0]?.userId,
            firstTeam: assignments[0]?.team,
            secondName: assignments[1]?.name,
            secondUserId: assignments[1]?.userId,
            secondTeam: assignments[1]?.team,
            thirdName: assignments[2]?.name,
            thirdUserId: assignments[2]?.userId,
            thirdTeam: assignments[2]?.team,
            hotelId: booking.hotelId,
            checkIn: booking.checkIn,
            checkOut: booking.checkOut,
            confirmed: !!booking.confirmed,
        };
    });
}
