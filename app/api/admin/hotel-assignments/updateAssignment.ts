// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { type ActionProps, noAccess } from '../../Action';
import { LogSeverity, LogType, Log } from '@lib/Log';
import { Privilege, can } from '@lib/auth/Privileges';
import { getEventBySlug } from '@lib/EventLoader';
import db, { tHotelsAssignments } from '@lib/database';

/**
 * Interface definition for the Hotel Assignment API, exposed through /api/admin/hotel-assignments.
 */
export const kUpdateAssignmentDefinition = z.object({
    request: z.object({
        /**
         * Slug of the event for which the assignment is in scope.
         */
        slug: z.string(),

        /**
         * Unique ID of the hotel assignment that's being updated.
         */
        id: z.coerce.number(),

        /**
         * Name of the first guest who will stay in this room.
         */
        firstName: z.string().optional(),

        /**
         * Name of the second guest who will stay in this room, if any.
         */
        secondName: z.string().optional(),

        /**
         * Name of the third guest who will stay in this room, if any.
         */
        thirdName: z.string().optional(),

        /**
         * ID of the hotel & hotel room that these volunteers will stay in.
         */
        hotelId: z.number().optional(),

        /**
         * Date on which this room will be able to check in.
         */
        checkIn: z.string().regex(/^[1|2](\d{3})\-(\d{2})-(\d{2})$/),

        /**
         * Date on which this room will be able to check out.
         */
        checkOut: z.string().regex(/^[1|2](\d{3})\-(\d{2})-(\d{2})$/),

        /**
         * Whether the hotel room has been formally booked.
         */
        booked: z.boolean(),
    }),
    response: z.strictObject({
        /**
         * Whether the updated hotel room assignment could successfully be saved.
         */
        success: z.boolean(),
    }),
});

export type UpdateAssignmentDefinition = z.infer<typeof kUpdateAssignmentDefinition>;

type Request = UpdateAssignmentDefinition['request'];
type Response = UpdateAssignmentDefinition['response'];

/**
 * API to update a hotel assignment within a given scope.
 */
export async function updateAssignment(request: Request, props: ActionProps): Promise<Response> {
    if (!can(props.user, Privilege.EventHotelManagement))
        noAccess();

    const event = await getEventBySlug(request.slug);
    if (!event)
        return { success: false };

    const affectedRows = await db.update(tHotelsAssignments)
        .set({
            assignmentHotelId: request.hotelId,
            assignmentCheckIn: new Date(request.checkIn),
            assignmentCheckOut: new Date(request.checkOut),
            assignmentBooked: request.booked ? 1 : 0,
        })
        .where(tHotelsAssignments.eventId.equals(event.eventId))
            .and(tHotelsAssignments.assignmentId.equals(request.id))
        .executeUpdate(/* min= */ 0, /* max= */ 1);

    // TODO: Log AdminHotelAssignmentUpdate
    // TODO: Log AdminHotelAssignVolunteer

    return { success: !!affectedRows };
}
