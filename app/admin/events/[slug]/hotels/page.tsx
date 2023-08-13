// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import { HotelConfiguration } from './HotelConfiguration';
import { HotelPendingAssignment } from './HotelPendingAssignment';
import { HotelSelection } from './HotelSelection';
import { NextRouterParams } from '@lib/NextRouterParams';
import { Privilege, can } from '@lib/auth/Privileges';
import { generateEventMetadataFn } from '../generateEventMetadataFn';
import { requireUser } from '@lib/auth/getUser';
import { sql } from '@lib/database';

/**
 * The <EventHotelsPage> page allows event administrators to see and make changes to the hotel room
 * situation for a particular event, including assigning rooms (and roommates!) to volunteers.
 */
export default async function EventHotelsPage(props: NextRouterParams<'slug'>) {
    const user = await requireUser();

    if (!can(user, Privilege.EventAdministrator))
        notFound();

    const [ rooms ] = await Promise.all([
        // -----------------------------------------------------------------------------------------
        // Hotel room configuration
        // -----------------------------------------------------------------------------------------
        sql`SELECT
                hotels.hotel_id AS id,
                hotels.hotel_description AS hotelDescription,
                hotels.hotel_name AS hotelName,
                hotels.hotel_room_name AS roomName,
                hotels.hotel_room_people AS roomPeople,
                hotels.hotel_room_price AS roomPrice
            FROM
                hotels
            LEFT JOIN
                events ON events.event_id = hotels.event_id
            WHERE
                hotels.hotel_room_visible = 1 AND
                events.event_slug = ${props.params.slug}
            ORDER BY
                hotels.hotel_name ASC,
                hotels.hotel_room_name ASC`,
    ]);

    if (!rooms.ok)
        notFound();

    return (
        <>
            <HotelSelection />
            <HotelPendingAssignment />
            <HotelConfiguration rooms={rooms.rowsPod as any} />
        </>
    );
}

export const generateMetadata = generateEventMetadataFn('Hotel');
