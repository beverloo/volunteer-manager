// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import type { ActionProps } from '../Action';
import { LogSeverity, LogType, Log } from '@lib/Log';
import { Privilege, can } from '@lib/auth/Privileges';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import { getEventBySlug } from '@lib/EventLoader';
import { getRegistration } from '@lib/RegistrationLoader';
import db, { tEventsTeams, tHotelsPreferences, tTeams } from '@lib/database';

/**
 * Interface definition for the Hotel API, exposed through /api/event/hotel-preferences.
 */
export const kHotelPreferencesDefinition = z.object({
    request: z.object({
        /**
         * The environment for which the application is being submitted.
         */
        environment: z.string(),

        /**
         * Unique slug of the event in which the volunteer would like to participate.
         */
        event: z.string(),

        /**
         * Preferences that the volunteer would like to share with us. A potentially partial set of
         * options, in case no hotel room is preferred at all.
         */
        preferences: z.object({
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
            checkIn: z.string().regex(/^[1|2](\d{3})\-(\d{2})-(\d{2})$/).optional(),

            /**
             * Date on which they would like to check out of their hotel room.
             */
            checkOut: z.string().regex(/^[1|2](\d{3})\-(\d{2})-(\d{2})$/).optional(),
        }),

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

export type HotelPreferencesDefinition = z.infer<typeof kHotelPreferencesDefinition>;

type Request = HotelPreferencesDefinition['request'];
type Response = HotelPreferencesDefinition['response'];

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
            privilege: Privilege.EventHotelManagement,
        });

        subjectUserId = request.adminOverrideUserId;
    }

    const event = await getEventBySlug(request.event);
    if (!event)
        return { success: false, error: 'The event no longer exists' };

    const registration = await getRegistration(request.environment, event, subjectUserId);
    if (!registration)
        return { success: false, error: 'Something seems to be wrong with your application' };

    if (!registration.hotelEligible && !registration.hotelPreferences)
        return { success: false, error: 'You are not eligible to book a hotel room' };

    if (!registration.hotelAvailable && !can(props.user, Privilege.EventHotelManagement))
        return { success: false, error: 'Hotel rooms cannot be booked yet, sorry!' };

    // TODO: Disallow updates when the room has been confirmed

    const eventsTeamsJoin = tEventsTeams.forUseInLeftJoin();

    const team = await db.selectFrom(tTeams)
        .leftJoin(eventsTeamsJoin)
            .on(eventsTeamsJoin.eventId.equals(event.eventId))
            .and(eventsTeamsJoin.teamId.equals(tTeams.teamId))
        .where(tTeams.teamEnvironment.equals(request.environment))
        .select({
            id: tTeams.teamId,
            enabled: eventsTeamsJoin.enableTeam,
        })
        .executeSelectNoneOrOne();

    if (!team || !team.enabled)
        return { success: false, error: 'This team does not participate in this event' };

    let update: {
        hotelId: number | null,
        hotelDateCheckIn: Date | null,
        hotelDateCheckOut: Date | null,
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
            hotelDateCheckIn: new Date(request.preferences.checkIn),
            hotelDateCheckOut: new Date(request.preferences.checkOut),
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
            hotelPreferencesUpdated: dbInstance.currentDateTime()
        })
        .onConflictDoUpdateSet({
            ...update,
            hotelPreferencesUpdated: dbInstance.currentDateTime()
        })
        .executeInsert(/* min= */ 0, /* max= */ 1);

    if (!affectedRows)
        return { success: false, error: 'Unable to update your preferences in the database' };

    if (!request.adminOverrideUserId) {
        await Log({
            type: LogType.ApplicationHotelPreferences,
            severity: LogSeverity.Info,
            sourceUser: props.user,
            data: {
                event: event.shortName,
                interested: !!request.preferences.interested,
                hotelId: request.preferences.hotelId,
            },
        });
    } else {
        await Log({
            type: LogType.AdminUpdateHotelPreferences,
            severity: LogSeverity.Warning,
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
