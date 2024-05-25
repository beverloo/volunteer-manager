// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';
import { z } from 'zod';

import type { ActionProps } from '../../Action';
import type { ApiDefinition, ApiRequest, ApiResponse } from '../../Types';
import { Log, LogType } from '@lib/Log';
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

    const dbInstance = db;
    await dbInstance.insertInto(tFeedback)
        .set({
            userId: props.user.userId,
            feedbackDate: dbInstance.currentZonedDateTime(),
            feedbackText: request.feedback,
        })
        .executeInsert();

    await Log({
        type: LogType.EventFeedbackSubmitted,
        severity: LogSeverity.Warning,
        sourceUser: props.user,
        data: {
            feedback: request.feedback,
        },
    });

    return { success: true };
}
