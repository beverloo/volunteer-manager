// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';
import { z } from 'zod';

import type { ActionProps } from '../../../Action';
import type { ApiDefinition, ApiRequest, ApiResponse } from '@app/api/Types';
import { RegistrationStatus } from '@lib/database/Types';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import { validateContext } from '../validateContext';
import db, { tRoles, tUsers, tUsersEvents } from '@lib/database';

/**
 * Type that describes the contents of a schedule as it will be consumed by the client.
 */
export const kScheduleDefinition = z.object({
    /**
     * The resources that should be shown on the schedule. Resources are volunteers, grouped by the
     * role that they have been assigned to, and then shown in alphabetical order.
     */
    resources: z.array(z.object({
        /**
         * Unique ID of the role that has been assigned to a volunteer.
         */
        id: z.string(),

        /**
         * Name of the role as it should be presented.
         */
        name: z.string(),

        /**
         * Volunteers who are part of this role, in alphabetical order.
         */
        children: z.array(z.object({
            /**
             * Unique ID that represents the volunteer as they exist in the database.
             */
            id: z.number(),

            /**
             * Name of the volunteer, as they should be referred to.
             */
            name: z.string(),

            // TODO: Avoid
            // TODO: Unavailable
        })),

        /**
         * Whether the row should be collapsed by default.
         */
        collapsed: z.boolean(),
    })),
});

/**
 * Export the `kScheduleDefinition` type so that the client can depend on it directly.
 */
export type GetScheduleResult = z.infer<typeof kScheduleDefinition>;

/**
 * Interface definition for the Schedule API.
 */
export const kGetScheduleDefinition = z.object({
    request: z.object({
        /**
         * URL-safe slug of the event for which the schedule is being retrieved.
         */
        event: z.string(),

        /**
         * URL-safe slug of the team for which the schedule is being retrieved.
         */
        team: z.string(),
    }),
    response: z.strictObject({
        /**
         * Whether the schedule could be retrieved successfully.
         */
        success: z.boolean(),

        /**
         * Error message in case the schedule could not be retrieved.
         */
        error: z.string().optional(),

        /**
         * The schedule that was retrieved, when successful.
         */
        schedule: kScheduleDefinition.optional(),
    }),
});

export type GetScheduleDefinition = ApiDefinition<typeof kGetScheduleDefinition>;

type Request = ApiRequest<typeof kGetScheduleDefinition>;
type Response = ApiResponse<typeof kGetScheduleDefinition>;

/**
 * API that allows leaders to retrieve the schedule's current state. Optimised for being called at
 * a preconfigured interval, to avoid collisions between mutations.
 */
export async function getSchedule(request: Request, props: ActionProps): Promise<Response> {
    executeAccessCheck(props.authenticationContext, {
        check: 'admin-event',
        event: request.event,
    });

    const { event, team } = await validateContext(request);
    if (!event || !team)
        notFound();

    const schedule: GetScheduleResult = {
        resources: [],
    };

    // ---------------------------------------------------------------------------------------------
    // Retrieve information about the volunteers.
    // ---------------------------------------------------------------------------------------------

    const dbInstance = db;
    const resources = await dbInstance.selectFrom(tUsersEvents)
        .innerJoin(tRoles)
            .on(tRoles.roleId.equals(tUsersEvents.roleId))
        .innerJoin(tUsers)
            .on(tUsers.userId.equals(tUsersEvents.userId))
        .where(tUsersEvents.eventId.equals(event.id))
            .and(tUsersEvents.teamId.equals(team.id))
            .and(tUsersEvents.registrationStatus.equals(RegistrationStatus.Accepted))
        .select({
            id: tRoles.roleId,
            name: tRoles.roleName,

            children: dbInstance.aggregateAsArray({
                id: tUsers.userId,
                name: tUsers.name,
            }),

            collapsed: dbInstance.const(false, 'boolean'),
        })
        .groupBy(tRoles.roleId)
        .orderBy(tRoles.roleOrder, 'asc')
        .executeSelectMany();

    for (const roleResource of resources) {
        const roleId = `role/${roleResource.id}`;

        roleResource.children.sort((lhs, rhs) => lhs.name.localeCompare(rhs.name));

        schedule.resources.push({
            id: roleId,
            name: roleResource.name,
            children: roleResource.children,
            collapsed: roleResource.collapsed,
        });
    }

    return {
        success: true,
        schedule
    };
}
