// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import { HotelConfiguration } from './HotelConfiguration';
import { HotelPendingAssignment } from './HotelPendingAssignment';
import { HotelSelection } from './HotelSelection';
import { NextRouterParams } from '@lib/NextRouterParams';
import { Privilege, can } from '@lib/auth/Privileges';
import { generateEventMetadataFn } from '../generateEventMetadataFn';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import db, { tEvents, tHotels } from '@lib/database';

/**
 * The <EventHotelsPage> page allows event administrators to see and make changes to the hotel room
 * situation for a particular event, including assigning rooms (and roommates!) to volunteers.
 */
export default async function EventHotelsPage(props: NextRouterParams<'slug'>) {
    const { user, event } = await verifyAccessAndFetchPageInfo(props.params);

    // Hotel management is more restricted than the general event administration.
    if (!can(user, Privilege.EventAdministrator))
        notFound();

    const eventsTable = tEvents.forUseInLeftJoin();

    const [ rooms ] = await Promise.all([
        // -----------------------------------------------------------------------------------------
        // Hotel room configuration
        // -----------------------------------------------------------------------------------------
        db.selectFrom(tHotels)
            .leftJoin(eventsTable).on(eventsTable.eventId.equals(tHotels.eventId))
            .select({
                id: tHotels.hotelId,
                hotelDescription: tHotels.hotelDescription,
                hotelName: tHotels.hotelName,
                roomName: tHotels.hotelRoomName,
                roomPeople: tHotels.hotelRoomPeople,
                roomPrice: tHotels.hotelRoomPrice,
            })
            .where(tHotels.hotelRoomVisible.equals(/* true= */ 1))
            .and(eventsTable.eventSlug.equals(props.params.slug))
            .orderBy(tHotels.hotelName, 'asc')
            .orderBy(tHotels.hotelRoomName, 'asc')
            .executeSelectMany(),
    ]);

    return (
        <>
            <HotelSelection />
            <HotelPendingAssignment />
            <HotelConfiguration event={event} rooms={rooms} />
        </>
    );
}

export const generateMetadata = generateEventMetadataFn('Hotel');
