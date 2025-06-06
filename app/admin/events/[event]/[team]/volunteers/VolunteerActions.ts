// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';
import { z } from 'zod/v4';

import type { Temporal } from '@lib/Temporal';
import { RecordLog, kLogSeverity, kLogType } from '@lib/Log';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import { executeServerAction } from '@lib/serverAction';
import db, { tEvents, tHotelsPreferences, tTeams, tUsersEvents } from '@lib/database';

import { kShirtFit, kShirtSize } from '@lib/database/Types';
import { kTemporalPlainDate } from '@app/api/Types';

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
 * Server action that clears the hotel preferences associated with a volunteer.
 */
export async function clearHotelPreferences(
    userId: number, eventId: number, teamId: number, formData: unknown)
{
    'use server';
    return executeServerAction(formData, kNoDataRequired, async (data, props) => {
        // TODO: Implement this server action.
        return { success: false, error: 'Not yet implemented' };
    });
}

/**
 * Zod type that describes the data required for updating an application.
 */
const kUpdateApplicationData = z.object({
    credits: z.number().optional(),
    socials: z.number().optional(),
    tshirtFit: z.enum(kShirtFit),
    tshirtSize: z.enum(kShirtSize),
});

/**
 * Server action that updates the information associated with an application.
 */
export async function updateApplication(
    userId: number, eventId: number, teamId: number, formData: unknown)
{
    'use server';
    return executeServerAction(formData, kUpdateApplicationData, async (data, props) => {
        const { event, team } = await getContextForVolunteerAction(userId, eventId, teamId);

        executeAccessCheck(props.authenticationContext, {
            check: 'admin-event',
            event: event.slug,
            permission: {
                permission: 'event.volunteers.information',
                operation: 'update',
                scope: {
                    event: event.slug,
                    team: team.slug,
                },
            },
        });

        const affectedRows = await db.update(tUsersEvents)
            .set({
                shirtFit: data.tshirtFit,
                shirtSize: data.tshirtSize,
                includeCredits: data.credits ? 1 : 0,
                includeSocials: data.socials ? 1 : 0,
            })
            .where(tUsersEvents.userId.equals(userId))
                .and(tUsersEvents.eventId.equals(eventId))
                .and(tUsersEvents.teamId.equals(teamId))
            .executeUpdate();

        if (!affectedRows)
            return { success: false, error: 'Unable to store the information in the database…' };

        RecordLog({
            type: kLogType.AdminUpdateTeamVolunteer,
            severity: kLogSeverity.Info,
            sourceUser: props.user,
            targetUser: userId,
            data: {
                event: event.shortName,
                eventId, teamId,
            },
        });

        return { success: true };
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
 * Zod type that describes the data required to update a volunteer's hotel preferences.
 */
const kUpdateHotelPreferencesData = z.object({
    interested: z.number(),

    // When interested:
    hotelId: z.number().optional(),
    checkIn: kTemporalPlainDate.optional(),
    checkOut: kTemporalPlainDate.optional(),
    sharingPeople: z.number().optional(),
    sharingPreferences: z.string().optional(),
});

/**
 * Server action that updates the hotel preferences of a volunteer.
 */
export async function updateHotelPreferences(
    userId: number, eventId: number, teamId: number, formData: unknown)
{
    'use server';
    return executeServerAction(formData, kUpdateHotelPreferencesData, async (data, props) => {
        const { event } = await getContextForVolunteerAction(userId, eventId, teamId);

        executeAccessCheck(props.authenticationContext, {
            check: 'admin-event',
            event: event.slug,
        });

        let update: {
            hotelId: number | null,
            hotelDateCheckIn: Temporal.PlainDate | null,
            hotelDateCheckOut: Temporal.PlainDate | null,
            hotelSharingPeople: number | null,
            hotelSharingPreferences: string | null
        };

        if (!data.interested) {
            update = {
                hotelId: null,
                hotelDateCheckIn: null,
                hotelDateCheckOut: null,
                hotelSharingPeople: null,
                hotelSharingPreferences: null,
            };
        } else {
            if (!data.hotelId)
                return { success: false, error: 'You must select a hotel room…' };

            if (!data.checkIn || !data.checkOut)
                return { success: false, error: 'You must select the dates for your booking…' };

            if (!data.sharingPeople || !data.sharingPreferences)
                return { success: false, error: 'You must select who you want to share with…' };

            update = {
                hotelId: data.hotelId,
                hotelDateCheckIn: data.checkIn,
                hotelDateCheckOut: data.checkOut,
                hotelSharingPeople: data.sharingPeople,
                hotelSharingPreferences: data.sharingPreferences,
            };
        }

        const dbInstance = db;
        const affectedRows = await dbInstance.insertInto(tHotelsPreferences)
            .set({
                userId: props.user!.userId,
                eventId: eventId,
                teamId: teamId,
                ...update,
                hotelPreferencesUpdated: dbInstance.currentZonedDateTime()
            })
            .onConflictDoUpdateSet({
                ...update,
                hotelPreferencesUpdated: dbInstance.currentZonedDateTime()
            })
            .executeInsert();

        if (!affectedRows)
            return { success: false, error: 'Unable to update your preferences in the database…' };

        RecordLog({
            type: kLogType.ApplicationHotelPreferences,
            severity: kLogSeverity.Info,
            sourceUser: props.user,
            data: {
                event: event.shortName,
                interested: !!data.interested,
                hotelId: data.hotelId,
            },
        });

        return { success: true, refresh: true };
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

        RecordLog({
            type: kLogType.EventVolunteerNotes,
            severity: kLogSeverity.Info,
            sourceUser: props.user,
            targetUser: userId,
            data: {
                event: event.shortName,
                notes: data.notes,
            },
        });

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
