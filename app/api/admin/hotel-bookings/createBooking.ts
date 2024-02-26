// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import type { ActionProps } from '../../Action';
import type { ApiDefinition, ApiRequest, ApiResponse } from '../../Types';
import { LogSeverity, LogType, Log } from '@lib/Log';
import { Privilege } from '@lib/auth/Privileges';
import { Temporal } from '@lib/Temporal';
import { dayjs } from '@lib/DateTime';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import { getEventBySlug } from '@lib/EventLoader';
import db, { tHotelsBookings } from '@lib/database';

/**
 * Interface definition for the Hotel Booking API, exposed through /api/admin/hotel-bookings.
 */
export const kCreateBookingDefinition = z.object({
    request: z.object({
        /**
         * Slug of the event for which the booking is in scope.
         */
        slug: z.string(),
    }),
    response: z.strictObject({
        /**
         * Unique ID of the booking when it was created successfully.
         */
        id: z.number(),
    }),
});

export type CreateBookingDefinition = ApiDefinition<typeof kCreateBookingDefinition>;

type Request = ApiRequest<typeof kCreateBookingDefinition>;
type Response = ApiResponse<typeof kCreateBookingDefinition>;

/**
 * API to create a new hotel booking within a given scope.
 */
export async function createBooking(request: Request, props: ActionProps): Promise<Response> {
    executeAccessCheck(props.authenticationContext, {
        check: 'admin-event',
        event: request.slug,
        privilege: Privilege.EventHotelManagement,
    });

    const event = await getEventBySlug(request.slug);
    if (!event)
        return { id: /* the event could not be found= */ 0 };

    const insertId = await db.insertInto(tHotelsBookings)
        .set({
            eventId: event.eventId,
            bookingCheckIn: Temporal.PlainDate.from(event.startTime),
            bookingCheckOut: Temporal.PlainDate.from(event.endTime),
            bookingConfirmed: 0,
            bookingVisible: 1,
        })
        .returningLastInsertedId()
        .executeInsert();

    if (!!insertId) {
        await Log({
            type: LogType.AdminHotelBookingCreate,
            severity: LogSeverity.Info,
            sourceUser: props.user,
            data: {
                event: event.shortName,
            },
        })
    }

    return { id: insertId };
}
