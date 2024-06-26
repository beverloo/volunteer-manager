// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Collapse from '@mui/material/Collapse';

import type { NextPageParams } from '@lib/NextRouterParams';
import { HotelAssignment } from './HotelAssignment';
import { HotelConfiguration } from './HotelConfiguration';
import { HotelPendingAssignment } from './HotelPendingAssignment';
import { HotelProcessor } from './HotelProcessor';
import { Privilege } from '@lib/auth/Privileges';
import { generateEventMetadataFn } from '../generateEventMetadataFn';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import db, { tEvents } from '@lib/database';

/**
 * The <EventHotelsPage> page allows event administrators to see and make changes to the hotel room
 * situation for a particular event, including assigning rooms (and roommates!) to volunteers.
 */
export default async function EventHotelsPage(props: NextPageParams<'slug'>) {
    const { event } = await verifyAccessAndFetchPageInfo(
        props.params, Privilege.EventHotelManagement);

    const processor = new HotelProcessor(event.id);
    await processor.initialise();

    // An alphabetically ordered list of volunteers who have requested a hotel room.
    const requests = processor.composeRequestOptions();

    // An alphabetically ordered list of the visible hotel room options.
    const rooms = processor.composeRoomOptions();

    // An alphabetically ordered list of volunteers whose requests have not been fulfilled yet.
    const unassignedRequests = processor.compileUnassignedRequests();

    // A prioritised list of the warnings in the current hotel room planning.
    const warnings = processor.compileWarnings();

    // ---------------------------------------------------------------------------------------------

    const dbInstance = db;
    const configuration = await dbInstance.selectFrom(tEvents)
        .where(tEvents.eventId.equals(event.id))
        .select({
            publishHotelInformation: tEvents.publishHotelInformation,
            enableHotelPreferencesStart:
                dbInstance.dateTimeAsString(tEvents.enableHotelPreferencesStart),
            enableHotelPreferencesEnd:
                dbInstance.dateTimeAsString(tEvents.enableHotelPreferencesEnd),
        })
        .executeSelectNoneOrOne() ?? undefined;

    return (
        <>
            <HotelAssignment event={event} requests={requests} rooms={rooms} warnings={warnings} />
            <Collapse in={!!unassignedRequests.length} sx={{ mt: '0px !important' }}>
                <HotelPendingAssignment requests={unassignedRequests} />
            </Collapse>
            <HotelConfiguration configuration={configuration} event={event} />
        </>
    );
}

export const generateMetadata = generateEventMetadataFn('Hotels');
