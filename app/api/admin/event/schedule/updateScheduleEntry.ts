// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';
import { z } from 'zod';

import type { ActionProps } from '../../../Action';
import type { ApiDefinition, ApiRequest, ApiResponse } from '@app/api/Types';
import { Privilege, can } from '@lib/auth/Privileges';

import { kTemporalZonedDateTime } from '@app/api/Types';

/**
 * Type that describes the schedule entry that should be updated.
 */
export const kUpdateScheduleEntryDefinition = z.object({
    request: z.object({
        /**
         * URL-safe slug of the event for which the schedule is being updated.
         */
        event: z.string(),

        /**
         * URL-safe slug of the team for which the schedule is being updated.
         */
        team: z.string(),

        /**
         * Unique ID of the schedule entry that should be updated.
         */
        id: z.array(z.string()),

        /**
         * Information about the shift that is being updated.
         */
        shift: z.object({
            /**
             * User ID of the user to whom the shift now belongs. This may have changed.
             */
            userId: z.number(),

            /**
             * Time at which the shift will start.
             */
            start: kTemporalZonedDateTime,

            /**
             * Time at which the shift will finish.
             */
            end: kTemporalZonedDateTime,

            // TODO: Shift type.
        }),
    }),
    response: z.strictObject({
        /**
         * Whether the schedule could be updated successfully.
         */
        success: z.boolean(),

        /**
         * Error message in case the schedule could not be updated.
         */
        error: z.string().optional(),
    }),
});

export type UpdateScheduleEntryDefinition = ApiDefinition<typeof kUpdateScheduleEntryDefinition>;

type Request = ApiRequest<typeof kUpdateScheduleEntryDefinition>;
type Response = ApiResponse<typeof kUpdateScheduleEntryDefinition>;

/**
 * API that allows leaders to update a schedule entry.
 */
export async function updateScheduleEntry(request: Request, props: ActionProps): Promise<Response> {
    if (!props.user || !can(props.user, Privilege.EventScheduleManagement))
        notFound();

    // TODO: Implement this function.
    return { success: false, error: 'Not yet implemented (update)' };
}
