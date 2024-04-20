// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';
import { z } from 'zod';

import type { ActionProps } from '../../../Action';
import type { ApiDefinition, ApiRequest, ApiResponse } from '@app/api/Types';
import { Privilege, can } from '@lib/auth/Privileges';

/**
 * Type that describes the schedule entry that should be created.
 */
export const kCreateScheduleEntryDefinition = z.object({
    request: z.object({
        /**
         * URL-safe slug of the event for which the schedule is being retrieved.
         */
        event: z.string(),

        /**
         * URL-safe slug of the team for which the schedule is being retrieved.
         */
        team: z.string(),
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

export type CreateScheduleEntryDefinition = ApiDefinition<typeof kCreateScheduleEntryDefinition>;

type Request = ApiRequest<typeof kCreateScheduleEntryDefinition>;
type Response = ApiResponse<typeof kCreateScheduleEntryDefinition>;

/**
 * API that allows leaders to create a new schedule entry.
 */
export async function createScheduleEntry(request: Request, props: ActionProps): Promise<Response> {
    if (!props.user || !can(props.user, Privilege.EventScheduleManagement))
        notFound();

    // TODO: Implement this function.
    return { success: false };
}
