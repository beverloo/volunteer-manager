// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import Collapse from '@mui/material/Collapse';

import type { NextRouterParams } from '@lib/NextRouterParams';
import { HotelAssignment } from './HotelAssignment';
import { HotelConfiguration } from './HotelConfiguration';
import { HotelPendingAssignment } from './HotelPendingAssignment';
import { Privilege, can } from '@lib/auth/Privileges';
import { RegistrationStatus } from '@lib/database/Types';
import { generateEventMetadataFn } from '../generateEventMetadataFn';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import db, { tEvents, tHotelsAssignments, tHotelsPreferences, tHotels, tTeams, tUsersEvents, tUsers }
    from '@lib/database';

/**
 * Retrives all hotel assignments from the database for the given `eventId`.
 */
async function getHotelAssignments(eventId: number) {
    const firstUsersJoin = tUsers.forUseInLeftJoinAs('p1');
    const secondUsersJoin = tUsers.forUseInLeftJoinAs('p2');
    const thirdUsersJoin = tUsers.forUseInLeftJoinAs('p3');

    const firstUsersEventsJoin = tUsersEvents.forUseInLeftJoinAs('p1e');
    const secondUsersEventsJoin = tUsersEvents.forUseInLeftJoinAs('p2e');
    const thirdUsersEventsJoin = tUsersEvents.forUseInLeftJoinAs('p3e');

    const firstTeamsJoin = tTeams.forUseInLeftJoinAs('p1t');
    const secondTeamsJoin = tTeams.forUseInLeftJoinAs('p2t');
    const thirdTeamsJoin = tTeams.forUseInLeftJoinAs('p3t');

    const hotelsJoin = tHotels.forUseInLeftJoin();

    // This is quite a complicated query, largely caused by the many joins necessary to individually
    // gather information about three individual occupants. Better normalization might help, but
    // would also make other operations more complicated. Let's live with this for now.
    const assignments = await db.selectFrom(tHotelsAssignments)
        .leftJoin(hotelsJoin)
            .on(hotelsJoin.hotelId.equals(tHotelsAssignments.assignmentHotelId))

        // Information regarding the first occupant:
        .leftJoin(firstUsersJoin)
            .on(firstUsersJoin.userId.equals(tHotelsAssignments.assignmentP1UserId))
        .leftJoin(firstUsersEventsJoin)
            .on(firstUsersEventsJoin.userId.equals(tHotelsAssignments.assignmentP1UserId))
            .and(firstUsersEventsJoin.eventId.equals(eventId))
            .and(firstUsersEventsJoin.registrationStatus.equals(RegistrationStatus.Accepted))
        .leftJoin(firstTeamsJoin)
            .on(firstTeamsJoin.teamId.equals(firstUsersEventsJoin.teamId))

        // Information regarding the second occupant:
        .leftJoin(secondUsersJoin)
            .on(secondUsersJoin.userId.equals(tHotelsAssignments.assignmentP2UserId))
        .leftJoin(secondUsersEventsJoin)
            .on(secondUsersEventsJoin.userId.equals(tHotelsAssignments.assignmentP2UserId))
            .and(secondUsersEventsJoin.eventId.equals(eventId))
            .and(secondUsersEventsJoin.registrationStatus.equals(RegistrationStatus.Accepted))
        .leftJoin(secondTeamsJoin)
            .on(secondTeamsJoin.teamId.equals(secondUsersEventsJoin.teamId))

        // Information regarding the third occupant:
        .leftJoin(thirdUsersJoin)
            .on(thirdUsersJoin.userId.equals(tHotelsAssignments.assignmentP3UserId))
        .leftJoin(thirdUsersEventsJoin)
            .on(thirdUsersEventsJoin.userId.equals(tHotelsAssignments.assignmentP3UserId))
            .and(thirdUsersEventsJoin.eventId.equals(eventId))
            .and(thirdUsersEventsJoin.registrationStatus.equals(RegistrationStatus.Accepted))
        .leftJoin(thirdTeamsJoin)
            .on(thirdTeamsJoin.teamId.equals(thirdUsersEventsJoin.teamId))

        .where(tHotelsAssignments.eventId.equals(eventId))
            .and(tHotelsAssignments.assignmentVisible.equals(/* true= */ 1))
        .select({
            id: tHotelsAssignments.assignmentId,

            firstUserId: tHotelsAssignments.assignmentP1UserId,
            firstTeam: firstTeamsJoin.teamEnvironment,
            firstName: tHotelsAssignments.assignmentP1Name.valueWhenNull(
                firstUsersJoin.firstName.concat(' ').concat(firstUsersJoin.lastName)),

            secondUserId: tHotelsAssignments.assignmentP2UserId,
            secondTeam: secondTeamsJoin.teamEnvironment,
            secondName: tHotelsAssignments.assignmentP2Name.valueWhenNull(
                secondUsersJoin.firstName.concat(' ').concat(secondUsersJoin.lastName)),

            thirdUserId: tHotelsAssignments.assignmentP3UserId,
            thirdTeam: thirdTeamsJoin.teamEnvironment,
            thirdName: tHotelsAssignments.assignmentP3Name.valueWhenNull(
                thirdUsersJoin.firstName.concat(' ').concat(thirdUsersJoin.lastName)),

            hotelId: hotelsJoin.hotelId,
            hotelName: hotelsJoin.hotelName,
            hotelRoom: hotelsJoin.hotelRoomName,

            checkIn: tHotelsAssignments.assignmentCheckIn,
            checkOut: tHotelsAssignments.assignmentCheckOut,

            booked: tHotelsAssignments.assignmentBooked.equals(/* true= */ 1),
        })
        .orderBy('booked', 'desc')
        .orderBy('checkIn', 'asc')
        .orderBy('checkOut', 'asc')
        .orderBy('id', 'asc')
        .executeSelectMany();

    const assignmentSet = new Set<number>();
    for (const assignment of assignments) {
        if (!!assignment.firstUserId)
            assignmentSet.add(assignment.firstUserId);
        if (!!assignment.secondUserId)
            assignmentSet.add(assignment.secondUserId);
        if (!!assignment.thirdUserId)
            assignmentSet.add(assignment.thirdUserId);
    }

    return { assignmentSet, assignments };
}

/**
 * Retrieves all hotel requests from the database for the given `eventId`.
 */
async function getHotelRequests(eventId: number) {
    const requests = await db.selectFrom(tHotelsPreferences)
        .innerJoin(tUsers)
            .on(tUsers.userId.equals(tHotelsPreferences.userId))
        .innerJoin(tUsersEvents)
            .on(tUsersEvents.userId.equals(tHotelsPreferences.userId))
                .and(tUsersEvents.eventId.equals(tHotelsPreferences.eventId))
                .and(tUsersEvents.teamId.equals(tHotelsPreferences.teamId))
        .innerJoin(tTeams)
            .on(tTeams.teamId.equals(tHotelsPreferences.teamId))
        .innerJoin(tHotels)
            .on(tHotels.hotelId.equals(tHotelsPreferences.hotelId))
        .where(tHotelsPreferences.eventId.equals(eventId))
            .and(tHotelsPreferences.hotelId.isNotNull())
        .select({
            // Required by the MUI <DataGrid> component:
            id: tHotelsPreferences.userId.multiply(1000).add(tHotelsPreferences.teamId),

            userId: tHotelsPreferences.userId,
            userName: tUsers.firstName.concat(' ').concat(tUsers.lastName),
            userStatus: tUsersEvents.registrationStatus,
            userTeam: tTeams.teamEnvironment,

            requestHotelId: tHotelsPreferences.hotelId,
            requestHotelName: tHotels.hotelName,
            requestHotelRoom: tHotels.hotelRoomName,

            requestCheckIn: tHotelsPreferences.hotelDateCheckIn,
            requestCheckOut: tHotelsPreferences.hotelDateCheckOut,
            requestSharingPeople: tHotelsPreferences.hotelSharingPeople,
            requestSharingPreferences: tHotelsPreferences.hotelSharingPreferences,
            requestUpdated: tHotelsPreferences.hotelPreferencesUpdated,
        })
        .orderBy('userName', 'asc')
        .executeSelectMany();

    const requestMap = new Map<number, typeof requests[number]>();
    for (const request of requests)
        requestMap.set(request.userId, request);

    return { requestMap, requests };
}

/**
 * The <EventHotelsPage> page allows event administrators to see and make changes to the hotel room
 * situation for a particular event, including assigning rooms (and roommates!) to volunteers.
 */
export default async function EventHotelsPage(props: NextRouterParams<'slug'>) {
    const { user, event } = await verifyAccessAndFetchPageInfo(props.params);

    // Hotel management is more restricted than the general event administration.
    if (!can(user, Privilege.EventHotelManagement))
        notFound();

    // ---------------------------------------------------------------------------------------------
    // Input necessary for <HotelSelection> and <HotelPendingAssignment>
    // ---------------------------------------------------------------------------------------------
    const { assignmentSet, assignments } = await getHotelAssignments(event.id);
    const { requestMap, requests } = await getHotelRequests(event.id);

    const unassignedRequests: typeof requests = [];
    for (const request of requests) {
        if (assignmentSet.has(request.userId))
            continue;  // the user already has a room

        if (request.userStatus !== RegistrationStatus.Accepted)
            continue;  // the user may not be entitled to a room anymore

        unassignedRequests.push(request);
    }

    // ---------------------------------------------------------------------------------------------
    // Input necessary for <HotelConfiguration>
    // ---------------------------------------------------------------------------------------------
    const rooms = await db.selectFrom(tHotels)
        .innerJoin(tEvents)
            .on(tEvents.eventId.equals(tHotels.eventId))
        .select({
            id: tHotels.hotelId,
            hotelDescription: tHotels.hotelDescription,
            hotelName: tHotels.hotelName,
            roomName: tHotels.hotelRoomName,
            roomPeople: tHotels.hotelRoomPeople,
            roomPrice: tHotels.hotelRoomPrice,
            visible: tHotels.hotelRoomVisible.equals(/* true= */ 1),
        })
        .where(tEvents.eventSlug.equals(props.params.slug))
        .orderBy(tHotels.hotelName, 'asc')
        .orderBy(tHotels.hotelRoomName, 'asc')
        .executeSelectMany();

    // Only visible rooms are included in the configuration panel, whereas the assignment panel will
    // include all rooms and show warnings when volunteers are assigned to non-existing rooms.
    const filteredRooms = rooms.filter(room => !!room.visible);

    return (
        <>
            <HotelAssignment assignments={assignments} event={event} requests={requests}
                             rooms={rooms} />
            <Collapse in={!!unassignedRequests.length} sx={{ mt: '0px !important' }}>
                <HotelPendingAssignment requests={unassignedRequests} />
            </Collapse>
            <HotelConfiguration event={event} rooms={filteredRooms} />
        </>
    );
}

export const generateMetadata = generateEventMetadataFn('Hotels');
