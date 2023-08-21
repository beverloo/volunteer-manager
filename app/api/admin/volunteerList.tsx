// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { type ActionProps, noAccess } from '../Action';
import { Privilege, can } from '@lib/auth/Privileges';
import db, { tUsers, tUsersEvents } from '@lib/database';

/**
 * Interface definition for the Volunteer API, exposed through /api/admin/volunteer-list. Only
 * event administrators and those with the ability to manage applications have the ability to call
 * this API.
 */
export const kVolunteerListDefinition = z.object({
    request: z.object({
        /**
         * ID of an event, participants in which should be omitted.
         */
        excludeEventId: z.number().optional(),
    }),
    response: z.strictObject({
        /**
         * The volunteers that could be retrieved based on the requested parameters.
         */
        volunteers: z.array(z.strictObject({
            /**
             * Unique ID of the user in the database.
             */
            userId: z.number(),

            /**
             * Name of the volunteer as it should be presented.
             */
            name: z.string(),

            /**
             * Whether this volunteer should not be selectable. Only used when the event filtering
             * functionality is used.
             */
            disabled: z.boolean().optional(),
        })),
    }),
});

export type VolunteerListDefinition = z.infer<typeof kVolunteerListDefinition>;

type Request = VolunteerListDefinition['request'];
type Response = VolunteerListDefinition['response'];

/**
 * API that allows certain volunteers to get a list of all other volunteers, for the purposes of
 * creating a new application on the fly.
 */
export async function volunteerList(request: Request, props: ActionProps): Promise<Response> {
    if (!can(props.user, Privilege.EventAdministrator) &&
            !can(props.user, Privilege.EventApplicationManagement)) {
        noAccess();
    }

    const usersEventsJoin = tUsersEvents.forUseInLeftJoin();
    const volunteers = await db.selectFrom(tUsers)
        .leftJoin(usersEventsJoin)
            .on(usersEventsJoin.userId.equals(tUsers.userId))
            .and(usersEventsJoin.eventId.equals(request.excludeEventId ?? /* invalid= */ 0))
        .select({
            userId: tUsers.userId,
            name: tUsers.firstName.concat(' ').concat(tUsers.lastName),
            disabled: usersEventsJoin.roleId.isNotNull()
        })
        .orderBy('name', 'asc')
        .executeSelectMany();

    return { volunteers };
}
