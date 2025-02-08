// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';
import { z } from 'zod';

import type { ActionProps } from '../../Action';
import type { ApiDefinition, ApiRequest, ApiResponse } from '../../Types';
import { Log, kLogType } from '@lib/Log';
import { LogSeverity } from '@lib/database/Types';
import db, { tFeedback } from '@lib/database';

/**
 * Interface definition for the Schedule API, exposed through /api/event/schedule/feedback
 */
export const kSubmitFeedbackDefinition = z.object({
    request: z.object({
        /**
         * Feedback that should be considered for next year's team.
         */
        feedback: z.string().min(5),

        /**
         * Optional overrides regarding the source of the feedback. Only exposed for individuals
         * with the Feedback permission, intended to be used by the Feedback Tool.
         */
        overrides: z.object({
            /**
             * User ID of the volunteer who submitted the feedback.
             */
            userId: z.number().nullable().optional(),

            /**
             * Name of the person who submitted the feedback.
             */
            name: z.string().nullable().optional(),

        }).optional(),
    }),
    response: z.strictObject({
        /**
         * Whether the feedback was submitted successfully.
         */
        success: z.boolean(),

        /**
         * Error message when something went wrong. Will be presented to the user.
         */
        error: z.string().optional(),
    }),
});

export type SubmitFeedbackDefinition = ApiDefinition<typeof kSubmitFeedbackDefinition>;

type Request = ApiRequest<typeof kSubmitFeedbackDefinition>;
type Response = ApiResponse<typeof kSubmitFeedbackDefinition>;

/**
 * API through which a volunteer is able to submit feedback.
 */
export async function submitFeedback(request: Request, props: ActionProps): Promise<Response> {
    if (!props.user || !props.authenticationContext.user)
        notFound();

    let userId: number | undefined = props.user.userId;
    let feedbackName: string | undefined;

    if (props.access.can('system.feedback') && !!request.overrides) {
        if (!!request.overrides.userId || !!request.overrides.name) {
            userId = request.overrides.userId ?? undefined;
            feedbackName = request.overrides.name ?? undefined;
        }
    }

    const dbInstance = db;
    await dbInstance.insertInto(tFeedback)
        .set({
            userId: userId,
            feedbackName: feedbackName,
            feedbackDate: dbInstance.currentZonedDateTime(),
            feedbackText: request.feedback,
        })
        .executeInsert();

    await Log({
        type: kLogType.EventFeedbackSubmitted,
        severity: LogSeverity.Warning,
        sourceUser: props.user,
        data: {
            feedback: request.feedback,
        },
    });

    return { success: true };
}
