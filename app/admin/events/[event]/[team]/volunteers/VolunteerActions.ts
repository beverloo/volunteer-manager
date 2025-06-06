// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';
import { z } from 'zod/v4';

import { RecordLog, kLogSeverity, kLogType } from '@lib/Log';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import { executeServerAction } from '@lib/serverAction';
import db, { tEvents, tTeams, tUsersEvents } from '@lib/database';

/**
 * Returns context, sourced from the database, for a volunteer action with the following properties.
 */
async function getContextForVolunteerAction(userId: number, eventId: number, teamId: number) {
    const result = await db.selectFrom(tUsersEvents)
        .innerJoin(tEvents)
            .on(tEvents.eventId.equals(tUsersEvents.eventId))
        .innerJoin(tTeams)
            .on(tTeams.teamId.equals(tUsersEvents.teamId))
        .where(tUsersEvents.userId.equals(userId))
            .and(tUsersEvents.eventId.equals(eventId))
            .and(tUsersEvents.teamId.equals(teamId))
        .select({
            event: {
                id: tEvents.eventId,

                shortName: tEvents.eventShortName,
                slug: tEvents.eventSlug,
            },
            team: {
                id: tTeams.teamId,
                slug: tTeams.teamSlug,
            },
        })
        .executeSelectNoneOrOne();

    if (!result)
        notFound();  // the given information cannot be validated

    return result;
}

/**
 * Zod type that describes that no data is expected.
 */
const kNoDataRequired = z.object({ /* no parameters */ });

/**
 * Server action that updates the information associated with an application.
 */
export async function updateApplication(formData: unknown) {
    'use server';
    return executeServerAction(formData, kNoDataRequired, async (data, props) => {
        // TODO: Implement this server action.
        return { success: false, error: 'Not yet implemented' };
    });
}

/**
 * Server action that updates the availability preferences of a volunteer.
 */
export async function updateAvailability(formData: unknown) {
    'use server';
    return executeServerAction(formData, kNoDataRequired, async (data, props) => {
        // TODO: Implement this server action.
        return { success: false, error: 'Not yet implemented' };
    });
}

/**
 * Server action that updates the hotel preferences of a volunteer.
 */
export async function updateHotelPreferences(formData: unknown) {
    'use server';
    return executeServerAction(formData, kNoDataRequired, async (data, props) => {
        // TODO: Implement this server action.
        return { success: false, error: 'Not yet implemented' };
    });
}

/**
 * Server action that updates the metadata associated with a volunteer.
 */
export async function updateMetadata(formData: unknown) {
    'use server';
    return executeServerAction(formData, kNoDataRequired, async (data, props) => {
        // TODO: Implement this server action.
        return { success: false, error: 'Not yet implemented' };
    });
}

/**
 * Zod type that describes the data required to update a volunteer's notes.
 */
const kUpdateNotesData = z.object({
    notes: z.string(),
});

/**
 * Server action that updates the stored notes for a volunteer.
 */
export async function updateNotes(
    userId: number, eventId: number, teamId: number, formData: unknown)
{
    'use server';
    return executeServerAction(formData, kUpdateNotesData, async (data, props) => {
        const { event } = await getContextForVolunteerAction(userId, eventId, teamId);

        executeAccessCheck(props.authenticationContext, {
            check: 'admin-event',
            event: event.slug,
        });

        const affectedRows = await db.update(tUsersEvents)
            .set({
                registrationNotes: !!data.notes.length ? data.notes : undefined,
            })
            .where(tUsersEvents.userId.equals(userId))
                .and(tUsersEvents.eventId.equals(eventId))
                .and(tUsersEvents.teamId.equals(teamId))
            .executeUpdate();

        if (!affectedRows)
            return { success: false, error: 'Unable to store the notes in the database…' };
/*
        RecordLog({
            type: kLogType.EventVolunteerNotes,
            severity: kLogSeverity.Info,
            sourceUser: props.user,
            targetUser: userId,
            data: {
                event: event.slug,
                notes: data.notes,
            },
        });
*/
        return { success: true };
    });
}

/**
 * Server action that updates the refund preferences of a volunteer.
 */
export async function updateRefundPreferences(formData: unknown) {
    'use server';
    return executeServerAction(formData, kNoDataRequired, async (data, props) => {
        // TODO: Implement this server action.
        return { success: false, error: 'Not yet implemented' };
    });
}

/**
 * Server action that updates the training preferences of a volunteer.
 */
export async function updateTrainingPreferences(formData: unknown) {
    'use server';
    return executeServerAction(formData, kNoDataRequired, async (data, props) => {
        // TODO: Implement this server action.
        return { success: false, error: 'Not yet implemented' };
    });
}
