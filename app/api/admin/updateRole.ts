// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import type { ActionProps } from '../Action';
import type { ApiDefinition, ApiRequest, ApiResponse } from '../Types';
import { Log, LogSeverity, LogType } from '@lib/Log';
import { Privilege } from '@lib/auth/Privileges';
import { RoleBadge } from '@lib/database/Types';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
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
         * The number of events the volunteer can indicate they really want to attend.
         */
        availabilityEventLimit: z.number(),

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

export type UpdateRoleDefinition = ApiDefinition<typeof kUpdateRoleDefinition>;

type Request = ApiRequest<typeof kUpdateRoleDefinition>;
type Response = ApiResponse<typeof kUpdateRoleDefinition>;

/**
 * API that allows information about particular roles to be updated. This includes whether they get
 * admin access, hotel and training eligibility and of course the role's name.
 */
export async function updateRole(request: Request, props: ActionProps): Promise<Response> {
    executeAccessCheck(props.authenticationContext, {
        check: 'admin',
        privilege: Privilege.VolunteerAdministrator,
    });

    await db.update(tRoles)
        .set({
            roleName: request.roleName,
            roleBadge: request.roleBadge,
            roleOrder: request.roleOrder,
            roleAvailabilityEventLimit: request.availabilityEventLimit,
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
