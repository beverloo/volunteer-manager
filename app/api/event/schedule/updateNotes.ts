// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';
import { z } from 'zod';

import type { ActionProps } from '../../Action';
import type { ApiDefinition, ApiRequest, ApiResponse } from '../../Types';
import { RegistrationStatus } from '@lib/database/Types';
import { Log, kLogSeverity, kLogType } from '@lib/Log';
import { getEventBySlug } from '@lib/EventLoader';
import db, { tUsersEvents } from '@lib/database';

/**
 * Interface definition for the Schedule API, exposed through /api/event/schedule/notes
 */
export const kUpdateNotesDefinition = z.object({
    request: z.object({
        /**
         * Unique slug of the event with which the notes should be associated.
         */
        event: z.string(),

        /**
         * Unique ID of the user whose notes should be updated.
         */
        userId: z.number(),

        /**
         * The notes as they should be stored in the database. May be empty.
         */
        notes: z.string(),
    }),
    response: z.strictObject({
        /**
         * Whether the notes was updated successfully.
         */
        success: z.boolean(),

        /**
         * Error message when something went wrong. Will be presented to the user.
         */
        error: z.string().optional(),
    }),
});

export type UpdateNotesDefinition = ApiDefinition<typeof kUpdateNotesDefinition>;

type Request = ApiRequest<typeof kUpdateNotesDefinition>;
type Response = ApiResponse<typeof kUpdateNotesDefinition>;

/**
 * API through which the notes associated with a volunteer can be updated.
 */
export async function updateNotes(request: Request, props: ActionProps): Promise<Response> {
    if (!props.user || !props.authenticationContext.user)
        notFound();

    const event = await getEventBySlug(request.event);
    if (!event)
        notFound();

    const affectedRows = await db.update(tUsersEvents)
        .set({
            registrationNotes: !!request.notes.length ? request.notes : undefined
        })
        .where(tUsersEvents.eventId.equals(event.id))
            .and(tUsersEvents.userId.equals(request.userId))
            .and(tUsersEvents.registrationStatus.equals(RegistrationStatus.Accepted))
        .executeUpdate();

    if (!!affectedRows) {
        await Log({
            type: kLogType.EventVolunteerNotes,
            severity: kLogSeverity.Info,
            sourceUser: props.user,
            targetUser: request.userId,
            data: {
                event: event.shortName,
                notes: request.notes,
            },
        });
    }

    return { success: !!affectedRows };
}
