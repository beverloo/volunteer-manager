// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';
import { z } from 'zod';

import type { ActionProps } from '../../../Action';
import type { ApiDefinition, ApiRequest, ApiResponse } from '@app/api/Types';
import { RegistrationStatus } from '@lib/database/Types';
import { getEventBySlug } from '@lib/EventLoader';
import { isValidShift } from './fn/isValidShift';
import db, { tSchedule, tTeams, tUsersEvents } from '@lib/database';

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
             * Unique ID of the defined shift, as it exists in the database.
             */
            shiftId: z.number().optional(),

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
    if (
        !props.user ||
        !props.access.can(
            'event.schedules', 'update', { event: request.event, team: request.team }))
    {
        notFound();
    }

    if (request.id.length !== 1)
        notFound();  // invalid request

    const id = parseInt(request.id[0] as string, 10);

    // TODO: Figure out if we need to handle this case, and if so, how. We might need to match the
    // shift's timings against a newly created shift in the database.
    if (Number.isNaN(id))
        return { success: false, error: 'The selected shift has not been saved yet' };

    const event = await getEventBySlug(request.event);
    if (!event)
        notFound();

    const volunteer = await db.selectFrom(tUsersEvents)
        .innerJoin(tTeams)
            .on(tTeams.teamId.equals(tUsersEvents.teamId))
        .where(tUsersEvents.userId.equals(request.shift.userId))
            .and(tUsersEvents.eventId.equals(event.id))
            .and(tUsersEvents.registrationStatus.equals(RegistrationStatus.Accepted))
        .select({
            id: tUsersEvents.userId,

            teamSlug: tTeams.teamSlug,

            availabilityExceptions: tUsersEvents.availabilityExceptions,
            availabilityTimeslots: tUsersEvents.availabilityTimeslots,
        })
        .executeSelectNoneOrOne();

    if (!volunteer || volunteer.teamSlug !== request.team)
        return { success: false, error: 'The selected volunteer is not part of this team' };

    const valid = await isValidShift(event, volunteer, request.shift, /* ignoreShift= */ id);
    if (!valid)
        return { success: false, error: 'Cannot schedule a shift at that time for the volunteer' };

    const dbInstance = db;
    const affectedRows = await dbInstance.update(tSchedule)
        .setIfValue({
            shiftId: request.shift.shiftId,
        })
        .set({
            userId: request.shift.userId,
            scheduleTimeStart: request.shift.start,
            scheduleTimeEnd: request.shift.end,
            scheduleUpdatedBy: props.user.userId,
            scheduleUpdated: dbInstance.currentZonedDateTime()
        })
        .where(tSchedule.scheduleId.equals(id))
            .and(tSchedule.eventId.equals(event.id))
        .executeUpdate();

    // TODO: Log

    return { success: !!affectedRows };
}
