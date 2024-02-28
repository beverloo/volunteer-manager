// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { HotelPendingRequestRowModel } from './HotelPendingAssignment';
import { Temporal, formatDate } from '@lib/Temporal';
import db, { tHotels, tHotelsAssignments, tHotelsBookings, tHotelsPreferences, tTeams, tUsers }
    from '@lib/database';

/**
 * Record detailing the information stored about an assignment. Roughly maps to the
 * `hotels_assignments` table.
 */
interface AssignmentRecord {
    id: number;
    userId?: number;
    name?: string;
}

/**
 * Record detailing the information stored about a booking. Roughly maps to the `hotels_bookings`
 * table.
 */
interface BookingRecord {
    // TODO
}

/**
 * Record detailing the information stored about a hotel room. Roughly maps to the `hotels` table.
 */
interface HotelRecord {
    id: number;
    hotelName: string;
    hotelDescription: string;
    roomName: string;
    visible: boolean;
}

/**
 * Record detailing the information stored about hotel preferences. Roughly maps to the
 * `hotels_preferences` table, and includes anyone who has expressed their preferences.
 */
interface PreferenceRecord {
    userId: number;
    name: string;
    team: string;
    hotelId?: number;
    checkIn?: Temporal.PlainDate;
    checkOut?: Temporal.PlainDate;
    updated: Temporal.ZonedDateTime;
}

/**
 * Type defining how we represent a warning in our system.
 */
type Warning = { volunteer: string, warning: string };

/**
 * The `HotelProcessor` class retrieves all hotel-associated information for a particular event and
 * is able to run logic operations on that data, such as partial views and warning generation.
 */
export class HotelProcessor {
    #eventId: number;

    #assignments: Map</* assignmentId= */ number, AssignmentRecord> = new Map;
    #bookings: Map</* bookingId=*/ number, BookingRecord> = new Map;
    #hotels: Map</* hotelId= */ number, HotelRecord> = new Map;
    #preferences: Map</* userId= */ number, PreferenceRecord> = new Map;

    #assignmentsForUsers: Map</* userId= */ number, /* assignmentId= */ number> = new Map;

    constructor(eventId: number) {
        this.#eventId = eventId;
    }

    async initialise() {
        const usersJoin = tUsers.forUseInLeftJoin();

        const assignments = await db.selectFrom(tHotelsAssignments)
            .innerJoin(tHotelsBookings)
                .on(tHotelsBookings.bookingId.equals(tHotelsAssignments.bookingId))
                    .and(tHotelsBookings.bookingVisible.equals(/* true= */ 1))
            .leftJoin(usersJoin)
                .on(usersJoin.userId.equals(tHotelsAssignments.assignmentUserId))
            .where(tHotelsAssignments.eventId.equals(this.#eventId))
            .select({
                id: tHotelsAssignments.assignmentId,
                userId: tHotelsAssignments.assignmentUserId,
                name: tHotelsAssignments.assignmentName.valueWhenNull(
                    usersJoin.name),
            })
            .executeSelectMany();

        for (const assignment of assignments) {
            this.#assignments.set(assignment.id, assignment);

            if (!!assignment.userId)
                this.#assignmentsForUsers.set(assignment.userId, assignment.id);
        }

        // TODO: `bookings`

        const hotels = await db.selectFrom(tHotels)
            .where(tHotels.eventId.equals(this.#eventId))
            .select({
                id: tHotels.hotelId,
                hotelName: tHotels.hotelName,
                hotelDescription: tHotels.hotelDescription,
                roomName: tHotels.hotelRoomName,
                visible: tHotels.hotelRoomVisible.equals(/* true= */ 1)
            })
            .orderBy('hotelName', 'asc')
                .orderBy('roomName', 'asc')
            .executeSelectMany();

        for (const hotel of hotels)
            this.#hotels.set(hotel.id, hotel);

        const preferences = await db.selectFrom(tHotelsPreferences)
            .innerJoin(tUsers)
                .on(tUsers.userId.equals(tHotelsPreferences.userId))
            .innerJoin(tTeams)
                .on(tTeams.teamId.equals(tHotelsPreferences.teamId))
            .where(tHotelsPreferences.eventId.equals(this.#eventId))
                .and(tHotelsPreferences.hotelId.isNotNull())
            .select({
                userId: tHotelsPreferences.userId,
                name: tUsers.name,
                team: tTeams.teamEnvironment,
                hotelId: tHotelsPreferences.hotelId,
                checkIn: tHotelsPreferences.hotelDateCheckIn,
                checkOut: tHotelsPreferences.hotelDateCheckOut,
                updated: tHotelsPreferences.hotelPreferencesUpdated,
            })
            .orderBy('name', 'asc')
            .executeSelectMany();

        for (const preference of preferences)
            this.#preferences.set(preference.userId, preference);
    }

    /**
     * Returns a list of the hotel requests that have not been fulfilled yet.
     */
    compileUnassignedRequests(): HotelPendingRequestRowModel[] {
        const unassignedRequests: HotelPendingRequestRowModel[] = [];
        for (const request of this.#preferences.values()) {
            if (this.#assignmentsForUsers.has(request.userId))
                continue;  // the volunteer already has an assigned room

            if (!request.hotelId || !request.checkIn || !request.checkOut)
                continue;  // the volunteer doesn't want a hotel room

            const hotel = this.#hotels.get(request.hotelId);
            if (!hotel)
                throw new Error(`Invalid hotel room specified for volunteer ${request.userId}`)

            unassignedRequests.push({
                id: request.userId,
                name: request.name,
                team: request.team,
                hotel: `${hotel.hotelName} (${hotel.roomName})`,
                checkIn: request.checkIn.toString(),
                checkOut: request.checkOut.toString(),
                requested: formatDate(request.updated, 'YYYY-MM-DD'),
            });
        }

        unassignedRequests.sort((lhs, rhs) => lhs.name.localeCompare(rhs.name));
        return unassignedRequests;
    }

    /**
     * Returns a list of warnings that should be displayed on the hotel room overview.
     */
    compileWarnings(): Warning[] {
        // TODO: Warnings
        // --- has been assigned to a booking that doesn't have a room (!hotelId)
        // --- has been assigned a hotel room that's been deleted
        // --- has been assigned a room multiple times (w/ overlap)
        // --- cancelled, but has still been assigned a hotel room
        // --- has been assigned a room different from their preferences
        // --- requested check-in on YYYY-MM-DD, but is booked in from YYYY-MM-DD
        // --- requested check-out on YYYY-MM-DD, but is booked in until YYYY-MM-DD
        return [
            {
                volunteer: 'AnimeCon Volunteer Manager',
                warning: 'is not currently able to flag any issues!',
            }
        ];
    }

    /**
     * Returns a list of the volunteers who have requested a room during the event.
     */
    composeRequestOptions(): string[] {
        return [ ...this.#preferences.values() ].map(preferences => preferences.name);
    }

    /**
     * Returns a list of the visible hotel room options known to this processor. Only options that
     * have not been removed will be considered.
     */
    composeRoomOptions(): { value: number, label: string }[] {
        return [ ...this.#hotels.values() ].filter(hotel => !!hotel.visible).map(hotel => ({
            value: hotel.id,
            label: `${hotel.hotelName} (${hotel.roomName})`,
        }));
    }
}
