// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { RegistrationStatus } from '@lib/database/Types';
import db, { tHotelsAssignments, tHotelsBookings, tHotelsPreferences, tHotels, tTeams, tUsersEvents, tUsers }
    from '@lib/database';

/**
 * Interface describing the format for hotel bookings.
 */
export interface HotelBooking {
    /**
     * Unique ID of the hotel room booking.
     */
    id: number;

    /**
     * Date on which this hotel room booking can check in.
     */
    checkIn: string;

    /**
     * Date on which this hotel room booking has to check out.
     */
    checkOut: string;

    /**
     * Whether the hotel room has been confirmed.
     */
    confirmed: boolean;

    /**
     * Information about the hotel. May be missing if no room has been selected yet.
     */
    hotel?: {
        id: number;

        name: string;
        roomName: string;

        visible: boolean;
    };

    /**
     * The people who will be staying in this hotel room. Primary occupant comes first.
     */
    occupants: {
        assignmentId: number;
        primary: boolean;

        name: string;

        userId?: number;
        userStatus?: RegistrationStatus;
        userTeam?: string;
    }[];
}

/**
 * Interface describing information assigned with hotel bookings.
 */
export interface HotelBookingsInfo {
    /**
     * Set of volunteers who have been assigned to (at least) one room.
     */
    assignedVolunteers: Set<number>;

    /**
     * The hotel room bookings that exist for a given `eventId`.
     */
    bookings: HotelBooking[];
}

/**
 * Retrieves all hotel bookings from the database for the given `eventId`. This combines information
 * from the `hotels_assignments` and the `hotels_bookings` tables. Optionally the `bookingId` can be
 * specified to limit results to a single booking.
 */
export async function getHotelBookings(eventId: number, bookingId?: number)
    : Promise<HotelBookingsInfo>
{
    const teamsJoin = tTeams.forUseInLeftJoin();
    const usersEventsJoin = tUsersEvents.forUseInLeftJoin();
    const usersJoin = tUsers.forUseInLeftJoin();

    const dbInstance = db;
    const assignments = await dbInstance.selectFrom(tHotelsAssignments)
        .innerJoin(tHotelsBookings)
            .on(tHotelsBookings.bookingId.equals(tHotelsAssignments.bookingId))
            .and(tHotelsBookings.bookingVisible.equals(/* true= */ 1))
        .leftJoin(usersJoin)
            .on(usersJoin.userId.equals(tHotelsAssignments.assignmentUserId))
        .leftJoin(usersEventsJoin)
            .on(usersEventsJoin.userId.equals(tHotelsAssignments.assignmentUserId))
            .and(usersEventsJoin.eventId.equals(tHotelsAssignments.eventId))
            .and(usersEventsJoin.registrationStatus.in([
                RegistrationStatus.Accepted, RegistrationStatus.Cancelled ]))
        .leftJoin(teamsJoin)
            .on(teamsJoin.teamId.equals(usersEventsJoin.teamId))
        .where(tHotelsAssignments.eventId.equals(eventId))
            .and(tHotelsAssignments.bookingId.equalsIfValue(bookingId))
        .select({
            id: tHotelsAssignments.assignmentId,
            bookingId: tHotelsAssignments.bookingId,
            primary: tHotelsAssignments.assignmentPrimary.equals(/* true= */ 1),

            // For volunteers and other people:
            assignmentName: tHotelsAssignments.assignmentName.valueWhenNull(
                usersJoin.firstName.concat(' ').concat(usersJoin.lastName)),

            // For volunteers:
            assignmentUserId: tHotelsAssignments.assignmentUserId,
            assignmentStatus: usersEventsJoin.registrationStatus,
            assignmentTeam: teamsJoin.teamEnvironment,
        })
        .orderBy(tHotelsAssignments.assignmentPrimary, 'desc')
        .orderBy('assignmentName', 'asc')
        .executeSelectMany();

    const assignedVolunteers = new Set<number>();
    for (const assignment of assignments) {
        if (!!assignment.assignmentUserId)
            assignedVolunteers.add(assignment.assignmentUserId);
    }

    const hotelsJoin = tHotels.forUseInLeftJoin();

    const rawBookings = await dbInstance.selectFrom(tHotelsBookings)
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

            checkIn: dbInstance.asDateString(tHotelsBookings.bookingCheckIn, 'required'),
            checkOut: dbInstance.asDateString(tHotelsBookings.bookingCheckOut, 'required'),
            confirmed: tHotelsBookings.bookingConfirmed,
        })
        .orderBy('confirmed', 'desc')
        .orderBy('checkIn', 'asc')
        .orderBy('checkOut', 'asc')
        .orderBy('id', 'asc')
        .executeSelectMany();

    const bookings: HotelBooking[] = [];
    for (const booking of rawBookings) {
        const occupants: HotelBooking['occupants'] = [];
        for (const assignment of assignments) {
            if (assignment.bookingId !== booking.id)
                continue;

            occupants.push({
                assignmentId: assignment.id,
                primary: assignment.primary,

                name: assignment.assignmentName!,

                userId: assignment.assignmentUserId,
                userStatus: assignment.assignmentStatus,
                userTeam: assignment.assignmentTeam,
            });
        }

        let hotel: HotelBooking['hotel'] = undefined;
        if (booking.hotelId && booking.hotelName && booking.hotelRoomName) {
            hotel = {
                id: booking.hotelId,
                name: booking.hotelName,
                roomName: booking.hotelRoomName,
                visible: !!booking.hotelVisible,
            }
        }

        bookings.push({
            id: booking.id,
            checkIn: booking.checkIn,
            checkOut: booking.checkOut,
            confirmed: !!booking.confirmed,
            hotel, occupants,
        });
    }

    return { assignedVolunteers, bookings };
}

/**
 * Interface describing the information associated with a hotel room request.
 */
export interface HotelRequest {
    /**
     * Unique ID of this request. Generated.
     */
    id: number;

    /**
     * Information about the volunteer for whom this booking is being made.
     */
    user: {
        id: number;

        name: string;
        team: string;
        status: RegistrationStatus,
    },

    /**
     * Date on which they would like to check in to the hotel room.
     */
    checkIn: string;

    /**
     * Date on which they would like to check out from the hotel room.
     */
    checkOut: string;

    /**
     * Information about the hotel and room in which they would like a booking.
     */
    hotel: {
        id: number;

        name: string;
        roomName: string;
    },

    /**
     * Number of people this volunteer would like to share their room with.
     */
    sharingPeople: number;

    /**
     * Preferences they've shared regarding sharing their room.
     */
    sharingPreferences?: string;

    /**
     * Date on which their request was last updated.
     */
    updated: string;
}

/**
 * Retrieves all hotel requests from the database for the given `eventId`.
 */
export async function getHotelRequests(eventId: number): Promise<HotelRequest[]> {
    const dbInstance = db;
    return await dbInstance.selectFrom(tHotelsPreferences)
        .innerJoin(tUsers)
            .on(tUsers.userId.equals(tHotelsPreferences.userId))
        .innerJoin(tUsersEvents)
            .on(tUsersEvents.userId.equals(tHotelsPreferences.userId))
                .and(tUsersEvents.eventId.equals(tHotelsPreferences.eventId))
                .and(tUsersEvents.teamId.equals(tHotelsPreferences.teamId))
                .and(tUsersEvents.registrationStatus.equals(RegistrationStatus.Accepted))
        .innerJoin(tTeams)
            .on(tTeams.teamId.equals(tHotelsPreferences.teamId))
        .innerJoin(tHotels)
            .on(tHotels.hotelId.equals(tHotelsPreferences.hotelId))
        .where(tHotelsPreferences.eventId.equals(eventId))
            .and(tHotelsPreferences.hotelId.isNotNull())
        .select({
            // Required by the MUI <DataGrid> component:
            id: tHotelsPreferences.userId.multiply(1000).add(tHotelsPreferences.teamId),

            user: {
                id: tHotelsPreferences.userId,

                name: tUsers.firstName.concat(' ').concat(tUsers.lastName),
                team: tTeams.teamEnvironment,
                status: tUsersEvents.registrationStatus,
            },

            hotel: {
                id: tHotelsPreferences.hotelId,

                name: tHotels.hotelName,
                roomName: tHotels.hotelRoomName,
            },

            checkIn: dbInstance.asDateString(tHotelsPreferences.hotelDateCheckIn, 'optional'),
            checkOut: dbInstance.asDateString(tHotelsPreferences.hotelDateCheckOut, 'optional'),

            sharingPeople: tHotelsPreferences.hotelSharingPeople,
            sharingPreferences: tHotelsPreferences.hotelSharingPreferences,

            updated:
                dbInstance.asDateTimeString(tHotelsPreferences.hotelPreferencesUpdated, 'required'),
        })
        .orderBy('user.name', 'asc')
        .executeSelectMany() as HotelRequest[];
}
