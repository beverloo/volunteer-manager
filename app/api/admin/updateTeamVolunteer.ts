// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { type ActionProps, noAccess } from '../Action';
import { Log, LogType, LogSeverity } from '@lib/Log';
import { Privilege, can } from '@lib/auth/Privileges';
import db, { tUsersEvents } from '@lib/database';

import { kApplicationProperties } from '../event/application';

/**
 * Interface definition for the Volunteer API, exposed through /api/admin/update-team-volunteer.
 */
export const kUpdateTeamVolunteerDefinition = z.object({
    request: z.object({
        /**
         * ID of the user for whom information is being updated.
         */
        userId: z.number(),

        /**
         * ID of the event that the volunteer is participating in.
         */
        eventId: z.number(),

        /**
         * ID of the team that information is to be updated for.
         */
        teamId: z.number(),

        /**
         * Information about the user's application that has to be updated.
         */
        application: z.object(kApplicationProperties).optional(),

        /**
         * Information about the user's application metadata that has to be updated.
         */
        metadata: z.object({
            /**
             * The date on which this volunteer created their application. May be NULL.
             */
            registrationDate: z.string().optional(),

            /**
             * Whether this volunteer is eligible for a hotel room beyond conventional rules.
             */
            hotelEligible: z.number().optional(),

            /**
             * Whether this volunteer is eligible to join the training beyond conventional rules.
             */
            trainingEligible: z.number().optional(),

        }).optional(),
    }),
    response: z.strictObject({
        /**
         * Whether the updates were stored successfully.
         */
        success: z.boolean(),
    }),
});

export type UpdateTeamVolunteerDefinition = z.infer<typeof kUpdateTeamVolunteerDefinition>;

type Request = UpdateTeamVolunteerDefinition['request'];
type Response = UpdateTeamVolunteerDefinition['response'];

/**
 * API that allows the information of a particular volunteer, associated with a particular team and
 * event, to be updated.
 */
export async function updateTeamVolunteer(request: Request, props: ActionProps): Promise<Response> {
    if (!can(props.user, Privilege.EventAdministrator))
        noAccess();

    let affectedRows: number = 0;

    const { application, metadata } = request;
    if (application !== undefined) {
        const [ preferenceTimingStart, preferenceTimingEnd ] =
            application.serviceTiming.split('-').map(v => parseInt(v, 10));

        affectedRows = await db.update(tUsersEvents)
            .set({
                shirtFit: application.tshirtFit as any,
                shirtSize: application.tshirtSize as any,
                preferences: application.preferences,
                preferenceHours: parseInt(application.serviceHours, 10),
                preferenceTimingStart, preferenceTimingEnd,
                includeCredits: application.credits ? 1 : 0,
                includeSocials: application.socials ? 1 : 0,
            })
            .where(tUsersEvents.userId.equals(request.userId))
                .and(tUsersEvents.eventId.equals(request.eventId))
                .and(tUsersEvents.teamId.equals(request.teamId))
            .executeUpdate(/* min= */ 0, /* max= */ 1);
    }

    if (metadata !== undefined) {
        if (!can(props.user, Privilege.EventVolunteerApplicationOverrides))
            noAccess();

        affectedRows = await db.update(tUsersEvents)
            .set({
                registrationDate:
                    metadata.registrationDate ? new Date(metadata.registrationDate) : null,
                hotelEligible: metadata.hotelEligible ?? null,
                trainingEligible: metadata.trainingEligible ?? null,
            })
            .where(tUsersEvents.userId.equals(request.userId))
                .and(tUsersEvents.eventId.equals(request.eventId))
                .and(tUsersEvents.teamId.equals(request.teamId))
            .executeUpdate(/* min= */ 0, /* max= */ 1);
    }

    if (!!affectedRows) {
        await Log({
            type: LogType.AdminUpdateTeamVolunteer,
            severity: LogSeverity.Info,
            sourceUser: props.user,
            targetUser: request.userId,
            data: {
                eventId: request.eventId,
                teamId: request.teamId,
            },
        });
    }

    return { success: !!affectedRows };
}
