// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import type { ActionProps } from '../Action';
import type { ApiDefinition, ApiRequest, ApiResponse } from '../Types';
import { Privilege } from '@lib/auth/Privileges';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
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

export type VolunteerListDefinition = ApiDefinition<typeof kVolunteerListDefinition>;

type Request = ApiRequest<typeof kVolunteerListDefinition>;
type Response = ApiResponse<typeof kVolunteerListDefinition>;

/**
 * API that allows certain volunteers to get a list of all other volunteers, for the purposes of
 * creating a new application on the fly.
 */
export async function volunteerList(request: Request, props: ActionProps): Promise<Response> {
    executeAccessCheck(props.authenticationContext, {
        check: 'admin',
        privilege: Privilege.EventApplicationManagement,
    });

    const usersEventsJoin = tUsersEvents.forUseInLeftJoin();
    const volunteers = await db.selectFrom(tUsers)
        .leftJoin(usersEventsJoin)
            .on(usersEventsJoin.userId.equals(tUsers.userId))
            .and(usersEventsJoin.eventId.equals(request.excludeEventId ?? /* invalid= */ 0))
        .select({
            userId: tUsers.userId,
            name: tUsers.name,
            disabled: usersEventsJoin.roleId.isNotNull()
        })
        .orderBy('name', 'asc')
        .executeSelectMany();

    return { volunteers };
}
