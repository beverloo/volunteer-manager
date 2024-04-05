// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';
import { z } from 'zod';

import type { ActionProps } from '../../Action';
import type { ApiDefinition, ApiRequest, ApiResponse } from '../../Types';
import { VendorTeam } from '@lib/database/Types';
import { getEventBySlug } from '@lib/EventLoader';

import { kTemporalZonedDateTime } from '../../Types';

/**
 * Interface definition for the information contained within a vendor schedule.
 */
export const kVendorScheduleEntry = z.strictObject({
    /**
     * Unique ID of the schedule entry.
     */
    id: z.number(),

    /**
     * Unique ID of the vendor to whom this schedule entry belongs.
     */
    vendorId: z.number(),

    /**
     * Date and time on which the scheduled availability will start.
     */
    start: kTemporalZonedDateTime,

    /**
     * Date and time on which the scheduled availability will end.
     */
    end: kTemporalZonedDateTime,
});

/**
 * Type definition of the vendor schedule information.
 */
export type VendorScheduleEntry = z.input<typeof kVendorScheduleEntry>;

/**
 * Interface definition for the public Vendor API, exposed through /api/admin/vendors/schedule.
 */
export const kUpdateVendorScheduleDefinition = z.object({
    request: z.object({
        /**
         * Unique slug of the event for whom vendor schedules are being updated.
         */
        event: z.string(),

        /**
         * Team of vendors for whom the schedules are being updated.
         */
        team: z.nativeEnum(VendorTeam),

        /**
         * Array of vendor Ids that were considered for this update, to help reduce race conditions.
         */
        resources: z.array(z.number()),

        /**
         * Array of schedule entries that should be stored to the database
         */
        schedule: z.array(kVendorScheduleEntry),
    }),
    response: z.object({
        /**
         * Whether the schedules could be updated successfully.
         */
        success: z.boolean(),

        /**
         * Optional message indicating what went wrong when a failure occurred.
         */
        error: z.string().optional(),
    }),
});

export type UpdateVendorScheduleDefinition = ApiDefinition<typeof kUpdateVendorScheduleDefinition>;

type Request = ApiRequest<typeof kUpdateVendorScheduleDefinition>;
type Response = ApiResponse<typeof kUpdateVendorScheduleDefinition>;

/**
 * API through which the schedules assigned to a particular team of vendors can be updated. All
 * entries will be updated in a singular API call, where this function will perform a diff.
 */
export async function updateVendorSchedule(request: Request, props: ActionProps): Promise<Response>
{
    const event = await getEventBySlug(request.event);
    if (!props.user || !event)
        notFound();

    return { success: true };
}
