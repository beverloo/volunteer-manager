// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Collapse from '@mui/material/Collapse';

import type { NextRouterParams } from '@lib/NextRouterParams';
import { HotelAssignment } from './HotelAssignment';
import { HotelConfiguration } from './HotelConfiguration';
import { HotelPendingAssignment } from './HotelPendingAssignment';
import { Privilege } from '@lib/auth/Privileges';
import { generateEventMetadataFn } from '../generateEventMetadataFn';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import db, {  tHotelsPreferences, tHotels, tUsers } from '@lib/database';

/**
 * The <EventHotelsPage> page allows event administrators to see and make changes to the hotel room
 * situation for a particular event, including assigning rooms (and roommates!) to volunteers.
 */
export default async function EventHotelsPage(props: NextRouterParams<'slug'>) {
    const { user, event } = await verifyAccessAndFetchPageInfo(
        props.params, Privilege.EventHotelManagement);

    const requests = await db.selectFrom(tHotelsPreferences)
        .innerJoin(tUsers)
            .on(tUsers.userId.equals(tHotelsPreferences.userId))
        .where(tHotelsPreferences.eventId.equals(event.id))
            .and(tHotelsPreferences.hotelId.isNotNull())
        .selectOneColumn(tUsers.firstName.concat(' ').concat(tUsers.lastName))
        .orderBy('result', 'asc')
        .executeSelectMany();

    const rooms = await db.selectFrom(tHotels)
        .where(tHotels.eventId.equals(event.id))
        .select({
            value: tHotels.hotelId,
            label: tHotels.hotelName.concat(' (').concat(tHotels.hotelRoomName).concat(')'),
        })
        .orderBy('label', 'asc')
        .executeSelectMany();

    // TODO: Warnings
    // --- has been assigned to a booking that doesn't have a room (!hotelId)
    // --- has been assigned a hotel room that's been deleted
    // --- has been assigned a room multiple times (w/ overlap)
    // --- cancelled, but has still been assigned a hotel room
    // --- has been assigned a room different from their preferences
    // --- requested check-in on YYYY-MM-DD, but is booked in from YYYY-MM-DD
    // --- requested check-out on YYYY-MM-DD, but is booked in until YYYY-MM-DD
    const warnings: { volunteer: string, warning: string }[] = [];

    // TODO: Unassigned requests
    const unassignedRequests: any[] = [ /* fixme */ ];

    return (
        <>
            <HotelAssignment event={event} requests={requests} rooms={rooms} warnings={warnings} />
            <Collapse in={!!unassignedRequests.length} sx={{ mt: '0px !important' }}>
                <HotelPendingAssignment requests={unassignedRequests} />
            </Collapse>
            <HotelConfiguration event={event} />
        </>
    );
}

export const generateMetadata = generateEventMetadataFn('Hotels');
