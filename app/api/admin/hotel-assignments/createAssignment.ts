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
export const kCreateAssignmentDefinition = z.object({
    request: z.object({
        /**
         * Slug of the event for which the assignment is in scope.
         */
        slug: z.string(),
    }),
    response: z.strictObject({
        /**
         * Unique ID of the assignment when it was created successfully.
         */
        id: z.number(),
    }),
});

export type CreateAssignmentDefinition = z.infer<typeof kCreateAssignmentDefinition>;

type Request = CreateAssignmentDefinition['request'];
type Response = CreateAssignmentDefinition['response'];

/**
 * API to create a new hotel assignment within a given scope.
 */
export async function createAssignment(request: Request, props: ActionProps): Promise<Response> {
    if (!can(props.user, Privilege.EventHotelManagement))
        noAccess();

    const event = await getEventBySlug(request.slug);
    if (!event)
        return { id: /* the event could not be found= */ 0 };

    const insertId = await db.insertInto(tHotelsAssignments)
        .set({
            eventId: event.eventId,
            assignmentCheckIn: new Date(event.startTime),
            assignmentCheckOut: new Date(event.endTime),
            assignmentBooked: 0,
            assignmentVisible: 1,
        })
        .returningLastInsertedId()
        .executeInsert();

    if (!!insertId) {
        await Log({
            type: LogType.AdminHotelAssignmentCreate,
            severity: LogSeverity.Info,
            sourceUser: props.user,
            data: {
                event: event.shortName,
            },
        })
    }

    return { id: insertId };
}
