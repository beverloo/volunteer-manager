// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';
import { z } from 'zod';

import { type DataTableEndpoints, createDataTableApi } from '@app/api/createDataTableApi';
import { LogSeverity, LogType, Log } from '@lib/Log';
import { Privilege } from '@lib/auth/Privileges';
import { Temporal } from '@lib/Temporal';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import { getEventBySlug } from '@lib/EventLoader';
import db, { tHotelsBookings, tTrainings } from '@lib/database';

import { getHotelBookings } from './getHotelBookings';

/**
 * Row model for an hotel assignment, as can be shown and modified in the administration area.
 */
const kHotelAssignmentRowModel = z.object({
/**
     * Unique ID of this entry in the configuration.
     */
    id: z.number(),

    /**
     * Name and user ID of the assignment's first occupant.
     */
    firstName: z.string().optional(),
    firstUserId: z.number().optional(),
    firstTeam: z.string().optional(),

    /**
     * Name and user ID of the assignment's second occupant.
     */
    secondName: z.string().optional(),
    secondUserId: z.number().optional(),
    secondTeam: z.string().optional(),

    /**
     * Name and user ID of the assignment's third occupant.
     */
    thirdName: z.string().optional(),
    thirdUserId: z.number().optional(),
    thirdTeam: z.string().optional(),

    /**
     * ID of the hotel (& room) option that this assignment is associated with.
     */
    hotelId: z.number().optional(),

    /**
     * Date (YYYY-MM-DD) on which the assignees will be checking in.
     */
    checkIn: z.string().regex(/^\d{4}\-\d{2}\-\d{2}$/),

    /**
     * Date (YYYY-MM-DD) on which the assignees will be checking out.
     */
    checkOut: z.string().regex(/^\d{4}\-\d{2}\-\d{2}$/),

    /**
     * Whether the hotel assignment has been confirmed.
     */
    confirmed: z.boolean(),
});

/**
 * Context required for the API.
 */
const kHotelAssignmentContext = z.object({
    context: z.object({
        /**
         * Unique slug of the event that the request is in scope of.
         */
        event: z.string(),
    }),
});

/**
 * Enable use of the API in `callApi()`.
 */
export type HotelsAssignmentsEndpoints =
    DataTableEndpoints<typeof kHotelAssignmentRowModel, typeof kHotelAssignmentContext>;

/**
 * Row model expected by the API.
 */
export type HotelsAssignmentsRowModel = z.infer<typeof kHotelAssignmentRowModel>;

function xLog(f: any) {} // ------------------------------------------------------------------------

/**
 * Implementation of the API.
 *
 * The following endpoints are provided by this implementation:
 *
 *     GET    /api/admin/hotels/assignments
 *     POST   /api/admin/hotels/assignments
 *     DELETE /api/admin/hotels/assignments/:id
 *     PUT    /api/admin/hotels/assignments/:id
 */
export const { DELETE, POST, PUT, GET } =
createDataTableApi(kHotelAssignmentRowModel, kHotelAssignmentContext, {
    async accessCheck({ context }, action, props) {
        executeAccessCheck(props.authenticationContext, {
            check: 'admin-event',
            event: context.event,
            privilege: Privilege.EventHotelManagement,
        });
    },

    async create({ context }) {
        const event = await getEventBySlug(context.event);
        if (!event)
            notFound();

        const bookingCheckIn = Temporal.PlainDate.from(event.startTime);
        const bookingCheckOut = Temporal.PlainDate.from(event.endTime);

        const insertId = await db.insertInto(tHotelsBookings)
            .set({
                eventId: event.id,
                bookingHotelId: null,
                bookingCheckIn,
                bookingCheckOut,
                bookingConfirmed: /* false= */ 0,
                bookingVisible: /* true= */ 1,
            })
            .returningLastInsertedId()
            .executeInsert();

        return {
            success: true,
            row: {
                id: insertId,
                checkIn: bookingCheckIn.toString(),
                checkOut: bookingCheckOut.toString(),
                confirmed: false,
            },
        };
    },

    async delete({ context, id }, props) {
        const event = await getEventBySlug(context.event);
        if (!event)
            notFound();

        const bookings = await getHotelBookings(event.id, id);
        if (!bookings || !bookings.length)
            notFound();

        const booking = bookings[0];

        const affectedRows = await db.update(tHotelsBookings)
            .set({
                bookingVisible: /* false= */ 0
            })
            .where(tHotelsBookings.bookingId.equals(id))
                .and(tHotelsBookings.eventId.equals(event.id))
            .executeUpdate();

        if (!!affectedRows) {
            for (const uid of [ booking.firstUserId, booking.secondUserId, booking.thirdUserId ]) {
                if (!!uid) {
                    await xLog({
                        type: LogType.AdminHotelAssignVolunteerDelete,
                        severity: LogSeverity.Warning,
                        sourceUser: props.user,
                        targetUser: uid,
                        data: {
                            event: event.shortName,
                        }
                    });
                }
            }
        }

        return { success: !!affectedRows };
    },

    async list({ context }) {
        const event = await getEventBySlug(context.event);
        if (!event)
            notFound();

        const bookings = await getHotelBookings(event.id);
        return {
            success: true,
            rowCount: bookings.length,
            rows: bookings,
        };
    },

    async update({ context, id, row }) {
        const event = await getEventBySlug(context.event);
        if (!event)
            notFound();

        const bookings = await getHotelBookings(event.id, id);
        if (!bookings || !bookings.length)
            notFound();

        const booking = bookings[0];

        const affectedRows = await db.update(tHotelsBookings)
            .set({
                bookingHotelId: row.hotelId,
                bookingCheckIn: Temporal.PlainDate.from(row.checkIn),
                bookingCheckOut: Temporal.PlainDate.from(row.checkOut),
                bookingConfirmed: row.confirmed ? 1 : 0,
            })
            .where(tHotelsBookings.bookingId.equals(id))
                .and(tHotelsBookings.eventId.equals(event.id))
            .executeUpdate();

        // TODO: Update assignments

        return { success: !!affectedRows };
    },

    async writeLog({ context }, mutation, props) {
        const event = await getEventBySlug(context.event);
        await xLog({
            type: LogType.AdminHotelBookingMutation,
            severity: LogSeverity.Info,
            sourceUser: props.user,
            data: {
                event: event?.shortName,
                mutation,
            },
        });
    },
});
