// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { type ActionProps, noAccess } from '../Action';
import { Log, LogSeverity, LogType } from '@lib/Log';
import { Privilege, can } from '@lib/auth/Privileges';
import { RoleBadge } from '@lib/database/Types';
import db, { tRoles } from '@lib/database';

/**
 * Interface definition for the Volunteer API, exposed through /api/admin/update-role.
 */
export const kUpdateRoleDefinition = z.object({
    request: z.object({
        /**
         * Unique ID of the role as it's represented in the database.
         */
        id: z.number(),

        /**
         * Name of the role as it should be presented to other people.
         */
        roleName: z.string(),

        /**
         * Badge that should be applied to the role. Optional.
         */
        roleBadge: z.nativeEnum(RoleBadge).optional(),

        /**
         * Ordering rules of the order.
         */
        roleOrder: z.number(),

        /**
         * Whether this role grants administrative access to a particular event.
         */
        adminAccess: z.boolean(),

        /**
         * Whether volunteers in this role are eligible to book a hotel room.
         */
        hotelEligible: z.boolean(),

        /**
         * Whether volunteers in this role are eligible to book a training.
         */
        trainingEligible: z.boolean(),
    }),
    response: z.strictObject({
        /**
         * Whether the API call was able to execute successfully.
         */
        success: z.boolean(),
    }),
});

export type UpdateRoleDefinition = z.infer<typeof kUpdateRoleDefinition>;

type Request = UpdateRoleDefinition['request'];
type Response = UpdateRoleDefinition['response'];

/**
 * API that allows
 */
export async function updateRole(request: Request, props: ActionProps): Promise<Response> {
    if (!can(props.user, Privilege.VolunteerAdministrator))
        noAccess();

    await db.update(tRoles)
        .set({
            roleName: request.roleName,
            roleBadge: request.roleBadge,
            roleOrder: request.roleOrder,
            roleAdminAccess: request.adminAccess ? 1 : 0,
            roleHotelEligible: request.hotelEligible ? 1 : 0,
            roleTrainingEligible: request.trainingEligible ? 1 : 0,
        })
        .where(tRoles.roleId.equals(request.id))
        .executeUpdate(/* min= */ 0, /* max= */ 1);

    await Log({
        type: LogType.AdminUpdateRole,
        severity: LogSeverity.Warning,
        sourceUser: props.user,
        data: {
            role: request.roleName,
        },
    });

    return { success: true };
}
