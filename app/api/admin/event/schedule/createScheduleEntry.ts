// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';
import { z } from 'zod';

import type { ActionProps } from '../../../Action';
import type { ApiDefinition, ApiRequest, ApiResponse } from '@app/api/Types';
import { Privilege, can } from '@lib/auth/Privileges';
import { RegistrationStatus } from '@lib/database/Types';
import { getEventBySlug } from '@lib/EventLoader';
import { isValidShift } from './fn/isValidShift';
import db, { tSchedule, tTeams, tUsersEvents } from '@lib/database';

import { kTemporalZonedDateTime } from '@app/api/Types';

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

        /**
         * The shift that should be created.
         */
        shift: z.object({
            /**
             * User for whom the shift is being added.
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

export type CreateScheduleEntryDefinition = ApiDefinition<typeof kCreateScheduleEntryDefinition>;

type Request = ApiRequest<typeof kCreateScheduleEntryDefinition>;
type Response = ApiResponse<typeof kCreateScheduleEntryDefinition>;

/**
 * API that allows leaders to create a new schedule entry.
 */
export async function createScheduleEntry(request: Request, props: ActionProps): Promise<Response> {
    if (!props.user || !can(props.user, Privilege.EventScheduleManagement))
        notFound();

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

    const valid = await isValidShift(event, volunteer, request.shift);
    if (!valid)
        return { success: false, error: 'Cannot schedule a shift at that time for the volunteer' };

    const dbInstance = db;
    await dbInstance.insertInto(tSchedule)
        .set({
            userId: volunteer.id,
            eventId: event.id,
            shiftId: /* to be determined= */ undefined,
            scheduleTimeStart: request.shift.start,
            scheduleTimeEnd: request.shift.end,
            scheduleUpdatedBy: props.user.userId,
            scheduleUpdated: dbInstance.currentZonedDateTime()
        })
        .executeInsert();

    // TODO: Log.

    return { success: true };
}
