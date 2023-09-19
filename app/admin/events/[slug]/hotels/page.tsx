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
import { getHotelBookings, getHotelRequests } from './HotelBookings';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import db, { tEvents, tHotels } from '@lib/database';

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
    const { assignedVolunteers, bookings } = await getHotelBookings(event.id);
    const requests = await getHotelRequests(event.id);

    const unassignedRequests: typeof requests = [];
    for (const request of requests) {
        if (assignedVolunteers.has(request.user.id))
            continue;  // the user already has a room

        if (request.user.status !== RegistrationStatus.Accepted)
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
            <HotelAssignment bookings={bookings} event={event} requests={requests}
                             rooms={rooms} />
            <Collapse in={!!unassignedRequests.length} sx={{ mt: '0px !important' }}>
                <HotelPendingAssignment requests={unassignedRequests} />
            </Collapse>
            <HotelConfiguration event={event} rooms={filteredRooms} />
        </>
    );
}

export const generateMetadata = generateEventMetadataFn('Hotels');
