// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import type { ActionProps } from '../Action';
import { Log, LogSeverity, LogType } from '@lib/Log';
import { Privilege } from '@lib/auth/Privileges';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import { getEventBySlug } from '@lib/EventLoader';
import db, { tTrainingsAssignments, tTrainings } from '@lib/database';

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

        /**
         * Must be set to an empty object when a new training session is being added.
         */
        create: z.object({ /* empty object */ }).optional(),

        /**
         * Must be set to an object when a training session is being deleted.
         */
        delete: z.object({
            /**
             * Unique ID of the training session that should be removed.
             */
            id: z.number(),
        }).optional(),

        /**
         * Must be set to an object when a training session is being updated.
         */
        update: z.object({
            /**
             * Unique ID of the training session that is being updated.
             */
            id: z.number(),

            /**
             * Address at which the training will be taking place.
             */
            trainingAddress: z.string().optional(),

            /**
             * Date at which the training will be taking place.
             */
            trainingStart: z.string().optional(),

            /**
             * Date at which the training will be taking place.
             */
            trainingEnd: z.string().optional(),

            /**
             * Maximum number of people that can join this training session.
             */
            trainingCapacity: z.number().optional(),

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

    // Operation: create
    if (request.create !== undefined) {
        const insertId =
            await db.insertInto(tTrainings)
                .values({ eventId: event.eventId })
                .returningLastInsertedId()
                .executeInsert();

        await Log({
            type: LogType.AdminEventTrainingMutation,
            severity: LogSeverity.Info,
            sourceUser: props.user,
            data: {
                eventName: event.shortName,
                mutation: 'Created',
            },
        });

        return { success: true, id: insertId };
    }

    // Operation: delete
    if (request.delete !== undefined) {
        const affectedRows =
            await db.deleteFrom(tTrainings)
                .where(tTrainings.trainingId.equals(request.delete.id))
                .and(tTrainings.eventId.equals(event.eventId))
                .executeDelete(/* min= */ 0, /* max= */ 1);

        if (affectedRows > 0) {
            await Log({
                type: LogType.AdminEventTrainingMutation,
                severity: LogSeverity.Info,
                sourceUser: props.user,
                data: {
                    eventName: event.shortName,
                    mutation: 'Deleted',
                },
            });
        }

        return { success: !!affectedRows };
    }

    // Operation: update
    if (request.update !== undefined) {
        const affectedRows = await db.update(tTrainings)
            .set({
                trainingAddress: request.update.trainingAddress,
                trainingStart:
                    request.update.trainingStart ? new Date(request.update.trainingStart)
                                                 : undefined,
                trainingEnd:
                    request.update.trainingEnd ? new Date(request.update.trainingEnd)
                                               : undefined,

                trainingCapacity: request.update.trainingCapacity,
            })
            .where(tTrainings.trainingId.equals(request.update.id))
            .and(tTrainings.eventId.equals(event.eventId))
            .executeUpdate(/* min= */ 0, /* max= */ 1);

        if (affectedRows > 0) {
            await Log({
                type: LogType.AdminEventTrainingMutation,
                severity: LogSeverity.Info,
                sourceUser: props.user,
                data: {
                    eventName: event.shortName,
                    mutation: 'Updated',
                },
            });
        }

        return { success: !!affectedRows };
    }

    return { success: false };
}
