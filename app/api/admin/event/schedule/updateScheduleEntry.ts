// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';
import { z } from 'zod';

import type { ActionProps } from '../../../Action';
import type { ApiDefinition, ApiRequest, ApiResponse } from '@app/api/Types';
import { Privilege, can } from '@lib/auth/Privileges';

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
        id: z.string(),
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
    return { success: false };
}
