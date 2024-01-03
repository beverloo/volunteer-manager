// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import type { ActionProps } from '../Action';
import { LogSeverity, LogType, Log } from '@lib/Log';
import { Privilege, can } from '@lib/auth/Privileges';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import { getEventBySlug } from '@lib/EventLoader';
import { getRegistration } from '@lib/RegistrationLoader';
import db, { tTrainingsAssignments } from '@lib/database';

/**
 * Interface definition for the Training API, exposed through /api/event/training-preferences.
 */
export const kTrainingPreferencesDefinition = z.object({
    request: z.object({
        /**
         * The environment for which the application is being submitted.
         */
        environment: z.string(),

        /**
         * Unique slug of the event in which the volunteer would like to participate.
         */
        event: z.string(),

        /**
         * Preferences that the volunteer would like to share with us. The literal "false" can be
         * passed by administrators to clear the preference instead.
         */
        preferences: z.literal(false).or(z.object({
            training: z.number(),
        })),

        /**
         * Property that allows administrators to push updates on behalf of other users.
         */
        adminOverrideUserId: z.number().optional(),
    }),
    response: z.strictObject({
        /**
         * Whether the hotel preferences were stored successfully.
         */
        success: z.boolean(),

        /**
         * Error message when something went wrong. Will be presented to the user.
         */
        error: z.string().optional(),
    }),
});

export type TrainingPreferencesDefinition = z.infer<typeof kTrainingPreferencesDefinition>;

type Request = TrainingPreferencesDefinition['request'];
type Response = TrainingPreferencesDefinition['response'];

/**
 * API through which volunteers can update their training preferences.
 */
export async function trainingPreferences(request: Request, props: ActionProps): Promise<Response> {
    if (!props.user)
        return { success: false, error: 'You must be signed in to share your preferences' };

    let subjectUserId = props.user.userId;
    if (!!request.adminOverrideUserId) {
        executeAccessCheck(props.authenticationContext, {
            check: 'admin-event',
            event: request.event,
            privilege: Privilege.EventTrainingManagement,
        });

        subjectUserId = request.adminOverrideUserId;
    }

    const event = await getEventBySlug(request.event);
    if (!event)
        return { success: false, error: 'The event no longer exists' };

    const registration = await getRegistration(request.environment, event, subjectUserId);
    if (!registration)
        return { success: false, error: 'Something seems to be wrong with your application' };

    if (!registration.trainingEligible && !registration.training)
        return { success: false, error: 'You are not eligible to participate in the training' };

    if (!registration.trainingAvailable && !can(props.user, Privilege.EventTrainingManagement))
        return { success: false, error: 'Trainings cannot be booked yet, sorry!' };

    // Case (0): The administrator may want to clear the training preferences.
    if (!request.preferences) {
        if (!request.adminOverrideUserId)
            return { success: false, error: 'Your request can only be updated' };

        const affectedRows = await db.deleteFrom(tTrainingsAssignments)
            .where(tTrainingsAssignments.assignmentUserId.equals(subjectUserId))
                .and(tTrainingsAssignments.eventId.equals(event.eventId))
            .executeDelete();

        if (!!affectedRows) {
            await Log({
                type: LogType.AdminClearTrainingPreferences,
                severity: LogSeverity.Warning,
                sourceUser: props.user,
                targetUser: request.adminOverrideUserId,
                data: {
                    event: event.shortName,
                },
            });
        }

        return { success: !!affectedRows };
    }

    let preferenceTrainingId: number | null = null;
    if (request.preferences.training >= 1)
        preferenceTrainingId = request.preferences.training;

    const dbInstance = db;
    const affectedRows = await dbInstance.insertInto(tTrainingsAssignments)
        .set({
            eventId: event.eventId,
            assignmentUserId: subjectUserId,
            assignmentExtraId: null,

            preferenceTrainingId,
            preferenceUpdated: dbInstance.currentDateTime2()
        })
        .onConflictDoUpdateSet({
            preferenceTrainingId,
            preferenceUpdated: dbInstance.currentDateTime2()
        })
        .executeInsert();

    if (!affectedRows)
        return { success: false, error: 'Unable to update your preferences in the database' };

    if (!request.adminOverrideUserId) {
        await Log({
            type: LogType.ApplicationTrainingPreferences,
            severity: LogSeverity.Info,
            sourceUser: props.user,
            data: {
                event: event.shortName,
                training: request.preferences.training,
            },
        });
    } else {
        await Log({
            type: LogType.AdminUpdateTrainingPreferences,
            severity: LogSeverity.Warning,
            sourceUser: props.user,
            targetUser: request.adminOverrideUserId,
            data: {
                event: event.shortName,
                training: request.preferences.training,
            },
        });
    }

    return { success: true };
}
