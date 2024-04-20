// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';
import { z } from 'zod';

import type { ActionProps } from '../../../Action';
import type { ApiDefinition, ApiRequest, ApiResponse } from '@app/api/Types';
import { Privilege, can } from '@lib/auth/Privileges';

/**
 * Type that describes the schedule entry that should be deleted.
 */
export const kDeleteScheduleEntryDefinition = z.object({
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
         * Unique ID of the schedule entry that should be deleted.
         */
        id: z.array(z.number().or(z.string())),
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

export type DeleteScheduleEntryDefinition = ApiDefinition<typeof kDeleteScheduleEntryDefinition>;

type Request = ApiRequest<typeof kDeleteScheduleEntryDefinition>;
type Response = ApiResponse<typeof kDeleteScheduleEntryDefinition>;

/**
 * API that allows leaders to delete a schedule entry.
 */
export async function deleteScheduleEntry(request: Request, props: ActionProps): Promise<Response> {
    if (!props.user || !can(props.user, Privilege.EventScheduleManagement))
        notFound();

    // TODO: Delete the shift.

    return { success: false, error: 'Not yet implemented (delete)' };
}
