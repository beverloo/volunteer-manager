// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod/v4';

import type { ActionProps } from '../Action';
import type { ApiDefinition, ApiRequest, ApiResponse } from '../Types';
import type { EnvironmentDomain } from '@lib/Environment';
import { RecordLog, kLogSeverity, kLogType } from '@lib/Log';
import { Temporal } from '@lib/Temporal';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import { getEventBySlug } from '@lib/EventLoader';
import { getRegistration } from '@lib/RegistrationLoader';
import db, { tEventsTeams, tHotelsPreferences, tTeams } from '@lib/database';

import { kTemporalPlainDate } from '../Types';

/**
 * Interface definition for the Hotel API, exposed through /api/event/hotel-preferences.
 */
export const kHotelPreferencesDefinition = z.object({
    request: z.object({
        /**
         * Unique slug of the event in which the volunteer would like to participate.
         */
        event: z.string(),

        /**
         * Unique slug of the team for which preferences are to be updated.
         */
        team: z.string(),

        /**
         * Preferences that the volunteer would like to share with us. A potentially partial set of
         * options, in case no hotel room is preferred at all. The literal "false" can be passed by
         * administrators to clear the preferences instead.
         */
        preferences: z.literal(false).or(z.object({
            /**
             * Whether the volunteer is interested in getting a hotel room.
             */
            interested: z.boolean(),

            /**
             * The hotel and room combination they would like, required when |interested| is true.
             */
            hotelId: z.number().optional(),

            /**
             * The number of people they would like to share this room with.
             */
            sharingPeople: z.number().optional(),

            /**
             * Their preferences regarding who they would like to share the room with.
             */
            sharingPreferences: z.string().optional(),

            /**
             * Date on which they would like to check in to their hotel room.
             */
            checkIn: kTemporalPlainDate.optional(),

            /**
             * Date on which they would like to check out of their hotel room.
             */
            checkOut: kTemporalPlainDate.optional(),
        })),

        /**
         * Property that allows administrators to push updates on behalf of other users.
         */
        adminOverrideUserId: z.number().optional(),
    }),
    response: z.strictObject({
        /**
         * Whether the hotel preferences were stored successfully.
         */
        success: z.boolean(),

        /**
         * Error message when something went wrong. Will be presented to the user.
         */
        error: z.string().optional(),
    }),
});

export type HotelPreferencesDefinition = ApiDefinition<typeof kHotelPreferencesDefinition>;

type Request = ApiRequest<typeof kHotelPreferencesDefinition>;
type Response = ApiResponse<typeof kHotelPreferencesDefinition>;

/**
 * API through which volunteers can update their hotel room preferences.
 */
export async function hotelPreferences(request: Request, props: ActionProps): Promise<Response> {
    if (!props.user)
        return { success: false, error: 'You must be signed in to share your preferences' };

    let subjectUserId = props.user.userId;
    if (!!request.adminOverrideUserId) {
        executeAccessCheck(props.authenticationContext, {
            check: 'admin-event',
            event: request.event,
            permission: {
                permission: 'event.hotels',
                scope: {
                    event: request.event,
                },
            },
        });

        subjectUserId = request.adminOverrideUserId;
    }

    const event = await getEventBySlug(request.event);
    if (!event)
        return { success: false, error: 'The event no longer exists' };

    const eventsTeamsJoin = tEventsTeams.forUseInLeftJoin();

    const team = await db.selectFrom(tTeams)
        .leftJoin(eventsTeamsJoin)
            .on(eventsTeamsJoin.eventId.equals(event.eventId))
            .and(eventsTeamsJoin.teamId.equals(tTeams.teamId))
        .where(tTeams.teamSlug.equals(request.team))
        .select({
            id: tTeams.teamId,
            enabled: eventsTeamsJoin.enableTeam,
            environment: tTeams.teamEnvironment,
        })
        .executeSelectNoneOrOne();

    if (!team || !team.enabled)
        return { success: false, error: 'This team does not participate in this event' };

    const registration =
        await getRegistration(team.environment as EnvironmentDomain, event, subjectUserId);
    if (!registration)
        return { success: false, error: 'Something seems to be wrong with your application' };

    if (!registration.hotelEligible && !registration.hotelPreferences)
        return { success: false, error: 'You are not eligible to book a hotel room' };

    if (!registration.hotelInformationPublished) {
        if (!props.access.can('event.hotels', { event: event.slug }))
            return { success: false, error: 'Hotel rooms cannot be booked yet, sorry!' };
    }

    // TODO: Disallow updates when the room has been confirmed

    // Case (0): The preferences should be cleared rather than amended.
    if (!request.preferences) {
        if (!request.adminOverrideUserId)
            return { success: false, error: 'Your preferences can only be updated' };

        const affectedRows = await db.deleteFrom(tHotelsPreferences)
            .where(tHotelsPreferences.userId.equals(subjectUserId))
                .and(tHotelsPreferences.eventId.equals(event.eventId))
                .and(tHotelsPreferences.teamId.equals(team.id))
            .executeDelete();

        if (!!affectedRows) {
            RecordLog({
                type: kLogType.AdminClearHotelPreferences,
                severity: kLogSeverity.Warning,
                sourceUser: props.user,
                targetUser: request.adminOverrideUserId,
                data: {
                    event: event.shortName,
                },
            });
        }

        return { success: !!affectedRows };
    }

    let update: {
        hotelId: number | null,
        hotelDateCheckIn: Temporal.PlainDate | null,
        hotelDateCheckOut: Temporal.PlainDate | null,
        hotelSharingPeople: number | null,
        hotelSharingPreferences: string | null
    };

    // Case (1): The volunteer expresses that they're not interested in a hotel room.
    if (!request.preferences.interested) {
        update = {
            hotelId: null,
            hotelDateCheckIn: null,
            hotelDateCheckOut: null,
            hotelSharingPeople: null,
            hotelSharingPreferences: null,
        };

    // Case (2): The volunteer expresses that they would like a hotel room.
    } else {
        if (!request.preferences.hotelId)
            return { success: false, error: 'You must select a hotel room' };

        if (!request.preferences.checkIn || !request.preferences.checkOut)
            return { success: false, error: 'You must select when you want to check in and out' };

        if (!request.preferences.sharingPeople || !request.preferences.sharingPreferences)
            return { success: false, error: 'You must select who you want to share with' };

        update = {
            hotelId: request.preferences.hotelId,
            hotelDateCheckIn: request.preferences.checkIn,
            hotelDateCheckOut: request.preferences.checkOut,
            hotelSharingPeople: request.preferences.sharingPeople,
            hotelSharingPreferences: request.preferences.sharingPreferences,
        };
    }

    const dbInstance = db;
    const affectedRows = await dbInstance.insertInto(tHotelsPreferences)
        .set({
            userId: subjectUserId,
            eventId: event.eventId,
            teamId: team.id,
            ...update,
            hotelPreferencesUpdated: dbInstance.currentZonedDateTime()
        })
        .onConflictDoUpdateSet({
            ...update,
            hotelPreferencesUpdated: dbInstance.currentZonedDateTime()
        })
        .executeInsert();

    if (!affectedRows)
        return { success: false, error: 'Unable to update your preferences in the database' };

    if (!request.adminOverrideUserId) {
        RecordLog({
            type: kLogType.ApplicationHotelPreferences,
            severity: kLogSeverity.Info,
            sourceUser: props.user,
            data: {
                event: event.shortName,
                interested: !!request.preferences.interested,
                hotelId: request.preferences.hotelId,
            },
        });
    } else {
        RecordLog({
            type: kLogType.AdminUpdateHotelPreferences,
            severity: kLogSeverity.Warning,
            sourceUser: props.user,
            targetUser: request.adminOverrideUserId,
            data: {
                event: event.shortName,
                interested: !!request.preferences.interested,
                hotelId: request.preferences.hotelId,
            },
        });
    }

    return { success: true };
}
