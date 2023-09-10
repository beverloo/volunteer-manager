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
export const kDeleteAssignmentDefinition = z.object({
    request: z.object({
        /**
         * Slug of the event for which the assignment is in scope.
         */
        slug: z.string(),

        /**
         * Unique ID of the hotel assignment that's being deleted.
         */
        id: z.coerce.number(),

    }),
    response: z.strictObject({
        /**
         * Whether the hotel room assignment could successfully be deleted.
         */
        success: z.boolean(),
    }),
});

export type DeleteAssignmentDefinition = z.infer<typeof kDeleteAssignmentDefinition>;

type Request = DeleteAssignmentDefinition['request'];
type Response = DeleteAssignmentDefinition['response'];

/**
 * API to delete a hotel assignment within a given scope.
 */
export async function deleteAssignment(request: Request, props: ActionProps): Promise<Response> {
    if (!can(props.user, Privilege.EventHotelManagement))
        noAccess();

    const event = await getEventBySlug(request.slug);
    if (!event)
        return { success: false };

    const existingAssignment = await db.selectFrom(tHotelsAssignments)
        .where(tHotelsAssignments.eventId.equals(event.eventId))
            .and(tHotelsAssignments.assignmentId.equals(request.id))
            .and(tHotelsAssignments.assignmentVisible.equals(/* true= */ 1))
        .select({
            firstUserId: tHotelsAssignments.assignmentP1UserId,
            secondUserId: tHotelsAssignments.assignmentP2UserId,
            thirdUserId: tHotelsAssignments.assignmentP3UserId,
        })
        .executeSelectNoneOrOne();

    if (!existingAssignment)
        return { success: false };

    const affectedRows = await db.update(tHotelsAssignments)
        .set({
            assignmentVisible: /* false= */ 0
        })
        .where(tHotelsAssignments.eventId.equals(event.eventId))
            .and(tHotelsAssignments.assignmentId.equals(request.id))
            .and(tHotelsAssignments.assignmentVisible.equals(/* true= */ 1))
        .executeUpdate(/* min= */ 0, /* max= */ 1);

    if (!!affectedRows) {
        await Log({
            type: LogType.AdminHotelAssignmentDelete,
            severity: LogSeverity.Info,
            sourceUser: props.user,
            data: {
                event: event.shortName,
            },
        });

        const affectedVolunteers = [
            existingAssignment.firstUserId,
            existingAssignment.secondUserId,
            existingAssignment.thirdUserId
        ];

        for (const userId of affectedVolunteers) {
            if (!userId)
                continue;  // this wasn't a volunteer-based assignment

            await Log({
                type: LogType.AdminHotelAssignVolunteerDelete,
                severity: LogSeverity.Warning,
                sourceUser: props.user,
                targetUser: userId,
                data: {
                    event: event.shortName,
                },
            });
        }
    }

    return { success: !!affectedRows };
}
