// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { type DataTableEndpoints, createDataTableApi } from '../../../../createDataTableApi';
import { LogSeverity, LogType, Log } from '@lib/Log';
import { Privilege } from '@lib/auth/Privileges';
import { RoleBadge } from '@lib/database/Types';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import db, { tRoles } from '@lib/database';

/**
 * Row model for a volunteering role. Roles are editable, but cannot be created or removed.
 */
const kRoleRowModel = z.object({
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

});

/**
 * This API does not require any context.
 */
const kRoleContext = z.never();

/**
 * Export type definitions so that the API can be used in `callApi()`.
 */
export type RolesEndpoints =
    DataTableEndpoints<typeof kRoleRowModel, typeof kRoleContext>;

/**
 * Export type definition for the API's Row Model.
 */
export type RoleRowModel = z.infer<typeof kRoleRowModel>;

/**
 * Export type definition for the API's context.
 */
export type RoleContext = z.infer<typeof kRoleContext>;

/**
 * This is implemented as a regular DataTable API. The following endpoints are provided by this
 * implementation:
 *
 *     GET /api/admin/volunteers/roles
 *     PUT /api/admin/volunteers/roles/:id
 */
export const { GET, PUT } = createDataTableApi(kRoleRowModel, kRoleContext, {
    async accessCheck(request, action, props) {
        executeAccessCheck(props.authenticationContext, {
            check: 'admin',
            privilege: Privilege.VolunteerAdministrator,
        });
    },

    async list({ sort }) {
        const roles = await db.selectFrom(tRoles)
            .select({
                id: tRoles.roleId,
                roleName: tRoles.roleName,
                roleBadge: tRoles.roleBadge,
                roleOrder: tRoles.roleOrder,
                availabilityEventLimit: tRoles.roleAvailabilityEventLimit,
                adminAccess: tRoles.roleAdminAccess.equals(/* true= */ 1),
                hotelEligible: tRoles.roleHotelEligible.equals(/* true= */ 1),
                trainingEligible: tRoles.roleTrainingEligible.equals(/* true= */ 1),
            })
            .orderBy(sort?.field ?? 'roleOrder', sort?.sort ?? 'asc')
            .executeSelectMany();

        return {
            success: true,
            rowCount: roles.length,
            rows: roles,
        };
    },

    async update({ row }) {
        const affectedRows = await db.update(tRoles)
            .set({
                roleName: row.roleName,
                roleBadge: row.roleBadge,
                roleOrder: row.roleOrder,
                roleAvailabilityEventLimit: row.availabilityEventLimit,
                roleAdminAccess: row.adminAccess ? 1 : 0,
                roleHotelEligible: row.hotelEligible ? 1 : 0,
                roleTrainingEligible: row.trainingEligible ? 1 : 0,
            })
            .where(tRoles.roleId.equals(row.id))
            .executeUpdate();

        return { success: !!affectedRows };
    },

    async writeLog({ id }, mutation, props) {
        const roleName = await db.selectFrom(tRoles)
            .where(tRoles.roleId.equals(id))
            .selectOneColumn(tRoles.roleName)
            .executeSelectNoneOrOne();

        await Log({
            type: LogType.AdminUpdateRole,
            severity: LogSeverity.Warning,
            sourceUser: props.user,
            data: {
                role: roleName,
            },
        });
    },
});
