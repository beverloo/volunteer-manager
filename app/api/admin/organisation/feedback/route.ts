// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod/v4';

import { type DataTableEndpoints, createDataTableApi } from '../../../createDataTableApi';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import db, { tFeedback, tUsers } from '@lib/database';

/**
 * Row model for an item of feedback that we've received from a volunteer.
 */
const kFeedbackRowModel = z.object({
    /**
     * Unique ID of this piece of feedback.
     */
    id: z.number(),

    /**
     * Date and time at which the feedback was received, in UTC.
     */
    date: z.string(),

    /**
     * Unique ID of the user who submitted this feedback.
     */
    userId: z.number().optional(),

    /**
     * Name of the user who submitted this feedback.
     */
    userName: z.string(),

    /**
     * The piece of feedback that has been received.
     */
    feedback: z.string(),
});

/**
 * This API does not require any context.
 */
const kFeedbackContext = z.never();

/**
 * Export type definitions so that the API can be used in `callApi()`.
 */
export type FeedbackEndpoints =
    DataTableEndpoints<typeof kFeedbackRowModel, typeof kFeedbackContext>;

/**
 * Export type definition for the API's Row Model.
 */
export type FeedbackRowModel = z.infer<typeof kFeedbackRowModel>;

/**
 * This is implemented as a regular DataTable API. The following endpoints are provided by this
 * implementation:
 *
 *     GET /api/admin/feedback
 */
export const { GET } = createDataTableApi(kFeedbackRowModel, kFeedbackContext, {
    async accessCheck(request, action, props) {
        executeAccessCheck(props.authenticationContext, {
            check: 'admin',
            permission: 'system.internals.outbox',
        });
    },

    async list({ pagination, sort }) {
        const usersJoin = tUsers.forUseInLeftJoin();

        const dbInstance = db;
        const data = await dbInstance.selectFrom(tFeedback)
            .leftJoin(usersJoin)
                .on(usersJoin.userId.equals(tFeedback.userId))
            .select({
                id: tFeedback.feedbackId,
                date: dbInstance.dateTimeAsString(tFeedback.feedbackDate),
                userId: tFeedback.userId,
                userName:
                    usersJoin.name.valueWhenNull(tFeedback.feedbackName).valueWhenNull('Unknown'),
                feedback: tFeedback.feedbackText,
            })
            .orderBy(sort?.field ?? 'date', sort?.sort ?? 'desc')
            .limitIfValue(pagination ? pagination.pageSize : null)
                .offsetIfValue(pagination ? pagination.page * pagination.pageSize : null)
            .executeSelectPage();

        return {
            success: true,
            rowCount: data.count,
            rows: data.data,
        };
    },
});

export const dynamic = 'force-dynamic';
