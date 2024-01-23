// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import type { ActionProps } from '../Action';
import { Log, LogSeverity, LogType } from '@lib/Log';
import { Privilege } from '@lib/auth/Privileges';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import { getEventBySlug } from '@lib/EventLoader';
import db, { tTrainingsAssignments } from '@lib/database';

/**
 * Interface definition for the Training API, exposed through /api/admin/training.
 */
export const kTrainingDefinition = z.object({
    request: z.object({
        /**
         * Slug of the event for which training sessions are being managed.
         */
        event: z.string(),

        /**
         * Must be set to an object when an assignment to a training is being updated.
         */
        assignment: z.object({
            /**
             * Unique ID of this training session, either "user/ID" or "extra/ID".
             */
            id: z.string(),

            /**
             * ID of the training to which the volunteer has been assigned.
             */
            assignedTrainingId: z.number().optional().nullable(),

            /**
             * Whether their participation in the training has been confirmed.
             */
            confirmed: z.boolean(),

        }).optional(),
    }),
    response: z.strictObject({
        /**
         * Whether the API call was executed successfully.
         */
        success: z.boolean(),

        /**
         * `create`: ID of the new training session that was added to the database
         */
        id: z.number().optional(),
    }),
});

export type TrainingDefinition = z.infer<typeof kTrainingDefinition>;

type Request = TrainingDefinition['request'];
type Response = TrainingDefinition['response'];

/**
 * API that allows event administrators to manage training sessions on the fly. This API supports
 * sessions to be created, updated and removed all the same.
 */
export async function training(request: Request, props: ActionProps): Promise<Response> {
    executeAccessCheck(props.authenticationContext, {
        check: 'admin-event',
        event: request.event,
        privilege: Privilege.EventTrainingManagement,
    });

    const event = await getEventBySlug(request.event);
    if (!event)
        return { success: false };

    // Operation: assignment
    if (request.assignment !== undefined) {
        let extraId: number | null = null;
        let userId: number | null = null;

        if (request.assignment.id.startsWith('extra/'))
            extraId = parseInt(request.assignment.id.substring(6), 10);
        if (request.assignment.id.startsWith('user/'))
            userId = parseInt(request.assignment.id.substring(5), 10);

        if (!extraId && !userId)
            return { success: false };

        const dbInstance = db;

        let assignmentTrainingId: null | number;
        let assignmentUpdated: null | ReturnType<typeof dbInstance.currentTimestamp2>;

        switch (request.assignment.assignedTrainingId) {
            case -1:   // reset
            case null: // new row
                assignmentTrainingId = null;
                assignmentUpdated = null;
                break;

            case 0:     // don't participate
                assignmentTrainingId = null;
                assignmentUpdated = dbInstance.currentTimestamp2();
                break;

            default:    // participate
                assignmentTrainingId = request.assignment.assignedTrainingId!;
                assignmentUpdated = dbInstance.currentTimestamp2();
                break;
        }

        await dbInstance.insertInto(tTrainingsAssignments)
            .set({
                eventId: event.eventId,
                assignmentUserId: userId,
                assignmentExtraId: extraId,
                assignmentTrainingId,
                assignmentUpdated,
                assignmentConfirmed: request.assignment.confirmed ? 1 : 0,
            })
            .onConflictDoUpdateSet({
                assignmentTrainingId,
                assignmentUpdated,
                assignmentConfirmed: request.assignment.confirmed ? 1 : 0,
            })
            .executeInsert();

        await Log({
            type: LogType.AdminEventTrainingAssignment,
            severity: LogSeverity.Info,
            sourceUser: props.user,
            targetUser: userId ?? undefined,
            data: {
                event: event.shortName,
            },
        });

        return { success: true };
    }

    return { success: false };
}
