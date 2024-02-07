// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import type { ActionProps } from '../Action';
import type { ApiDefinition, ApiRequest, ApiResponse } from '../Types';
import { Log, LogSeverity, LogType } from '@lib/Log';
import { Privilege } from '@lib/auth/Privileges';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import { getEventBySlug } from '@lib/EventLoader';
import db, { tTrainingsAssignments, tTrainingsExtra } from '@lib/database';
import { kTemporalPlainDate } from '../Types';

/**
 * Interface definition for the Training API, exposed through /api/admin/training-extra.
 */
export const kTrainingExtraDefinition = z.object({
    request: z.object({
        /**
         * Slug of the event for which extra participants are being managed.
         */
        event: z.string(),

        /**
         * Must be set to an empty object when a new participant is being added.
         */
        create: z.object({ /* empty object */ }).optional(),

        /**
         * Must be set to an object when a training participant is being deleted.
         */
        delete: z.object({
            /**
             * Unique ID of the training participant that should be removed.
             */
            id: z.number(),
        }).optional(),

        /**
         * Must be set to an object when a training participant is being updated.
         */
        update: z.object({
            /**
             * Unique ID of the training participant that is being updated.
             */
            id: z.number(),

            /**
             * Name of the participant whose profile is being updated.
             */
            trainingExtraName: z.string().optional(),

            /**
             * E-mail address of the participant at which they can be reached.
             */
            trainingExtraEmail: z.string().optional(),

            /**
             * Date of birth of the participant, necessary for certification.
             */
            trainingExtraBirthdate: kTemporalPlainDate.optional(),

            /**
             * ID of the training in which the extra would like to participate.
             */
            preferenceTrainingId: z.number().optional(),

        }).optional(),
    }),
    response: z.strictObject({
        /**
         * Whether the API call was executed successfully.
         */
        success: z.boolean(),

        /**
         * `create`: ID of the new training participant that was added to the database
         */
        id: z.number().optional(),
    }),
});

export type TrainingExtraDefinition = ApiDefinition<typeof kTrainingExtraDefinition>;

type Request = ApiRequest<typeof kTrainingExtraDefinition>;
type Response = ApiResponse<typeof kTrainingExtraDefinition>;

/**
 * API that allows event administrators to manage extra training participants on the fly. These are
 * people outside of our organisation who would like to participate in the training.
 */
export async function trainingExtra(request: Request, props: ActionProps): Promise<Response> {
    executeAccessCheck(props.authenticationContext, {
        check: 'admin-event',
        event: request.event,
        privilege: Privilege.EventTrainingManagement,
    });

    const event = await getEventBySlug(request.event);
    if (!event)
        return { success: false };

    // Operation: create
    if (request.create !== undefined) {
        const insertId =
            await db.insertInto(tTrainingsExtra)
                .values({ eventId: event.eventId })
                .returningLastInsertedId()
                .executeInsert();

        await Log({
            type: LogType.AdminEventTrainingExtraMutation,
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
            await db.deleteFrom(tTrainingsExtra)
                .where(tTrainingsExtra.trainingExtraId.equals(request.delete.id))
                .and(tTrainingsExtra.eventId.equals(event.eventId))
                .executeDelete(/* min= */ 0, /* max= */ 1);

        if (affectedRows > 0) {
            await Log({
                type: LogType.AdminEventTrainingExtraMutation,
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
        const dbInstance = db;
        const affectedRows = await dbInstance.transaction(async () => {
            if (!request.update)
                return 0;  // this cannot happen

            const affectedRows = await dbInstance.update(tTrainingsExtra)
                .set({
                    trainingExtraName: request.update.trainingExtraName,
                    trainingExtraEmail: request.update.trainingExtraEmail,
                    trainingExtraBirthdate: request.update.trainingExtraBirthdate
                })
                .where(tTrainingsExtra.trainingExtraId.equals(request.update.id))
                .and(tTrainingsExtra.eventId.equals(event.eventId))
                .executeUpdate(/* min= */ 0, /* max= */ 1);

            if (request.update.preferenceTrainingId !== undefined) {
                const preferenceTrainingId =
                    request.update.preferenceTrainingId === 0 ? null
                                                              : request.update.preferenceTrainingId;

                await dbInstance.insertInto(tTrainingsAssignments)
                    .set({
                        eventId: event.eventId,
                        assignmentExtraId: request.update.id,
                        preferenceTrainingId,
                        preferenceUpdated: dbInstance.currentTimestamp(),
                    })
                    .onConflictDoUpdateSet({
                        preferenceTrainingId,
                        preferenceUpdated: dbInstance.currentTimestamp(),
                    })
                    .executeInsert();
            }

            return affectedRows;
        });

        if (affectedRows > 0) {
            await Log({
                type: LogType.AdminEventTrainingExtraMutation,
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
