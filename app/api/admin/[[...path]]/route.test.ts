// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { Privilege } from '@lib/auth/Privileges';
import { executeActionForTests, injectPermissionTestsForAction } from '../../ActionTestSupport';
import { useMockConnection } from '@lib/database/Connection';

import { hotel, kHotelDefinition } from '../hotel';
import { logs, kLogsDefinition } from '../logs';
import { resetAccessCode, kResetAccessCodeDefinition } from '../resetAccessCode';
import { resetPasswordLink, kResetPasswordLinkDefinition } from '../resetPasswordLink';
import { updateActivation, kUpdateActivationDefinition } from '../updateActivation';
import { updatePermissions, kUpdatePermissionsDefinition } from '../updatePermissions';
import { updateRole, kUpdateRoleDefinition } from '../updateRole';
import { updateVolunteer, kUpdateVolunteerDefinition } from '../updateVolunteer';
import { volunteerRoles, kVolunteerRolesDefinition } from '../volunteerRoles';

describe('API Endpoints: /api/admin', () => {
    const mockConnection = useMockConnection();

    // ---------------------------------------------------------------------------------------------
    // hotelCreate
    // ---------------------------------------------------------------------------------------------

    injectPermissionTestsForAction(kHotelDefinition, hotel, {
        request: { event: '2024' },
        insufficientPrivileges: Privilege.EventContentOverride |
                                Privilege.VolunteerAdministrator
    });

    it('requires a valid event', async () => {
        const response = await executeActionForTests(kHotelDefinition, hotel, {
            request: { event: 'invalid-event' },
            user: { privileges: BigInt(Privilege.Administrator) },
        });

        expect(response.ok).toBeFalsy();
        expect(await response.json()).toEqual({
            success: false,
        });
    });

    // ---------------------------------------------------------------------------------------------
    // logs
    // ---------------------------------------------------------------------------------------------

    injectPermissionTestsForAction(kLogsDefinition, logs, {
        request: { page: 0, pageSize: 25, sortModel: [] },
        insufficientPrivileges: Privilege.EventAdministrator,
    });

    // ---------------------------------------------------------------------------------------------
    // resetAccessCode
    // ---------------------------------------------------------------------------------------------

    injectPermissionTestsForAction(kResetAccessCodeDefinition, resetAccessCode, {
        request: { userId: 1 },
        insufficientPrivileges: Privilege.SystemAdministrator,
    });

    // ---------------------------------------------------------------------------------------------
    // resetPasswordLink
    // ---------------------------------------------------------------------------------------------

    injectPermissionTestsForAction(kResetPasswordLinkDefinition, resetPasswordLink, {
        request: { userId: 1 },
        insufficientPrivileges: Privilege.VolunteerAdministrator,
    });

    // ---------------------------------------------------------------------------------------------
    // updateActivation
    // ---------------------------------------------------------------------------------------------

    injectPermissionTestsForAction(kUpdateActivationDefinition, updateActivation, {
        request: { userId: 1, activated: true },
        insufficientPrivileges: Privilege.SystemAdministrator,
    });

    // ---------------------------------------------------------------------------------------------
    // updatePermissions
    // ---------------------------------------------------------------------------------------------

    injectPermissionTestsForAction(kUpdatePermissionsDefinition, updatePermissions, {
        request: { userId: 1, privileges: '13' },
        insufficientPrivileges: Privilege.VolunteerAdministrator,
    });

    // ---------------------------------------------------------------------------------------------
    // updateRole
    // ---------------------------------------------------------------------------------------------

    injectPermissionTestsForAction(kUpdateRoleDefinition, updateRole, {
        request: {
            id: 1,
            roleName: 'foo',
            roleBadge: undefined,
            roleOrder: 1,
            adminAccess: false,
            hotelEligible: false,
            trainingEligible: true,
        },
        insufficientPrivileges: Privilege.VolunteerAvatarManagement,
    });

    // ---------------------------------------------------------------------------------------------
    // updateVolunteer
    // ---------------------------------------------------------------------------------------------

    injectPermissionTestsForAction(kUpdateVolunteerDefinition, updateVolunteer, {
        request: {
            userId: 1,
            gender: 'Other',
            firstName: 'Foo',
            lastName: 'Bar',
        },
        insufficientPrivileges: Privilege.SystemAdministrator,
    });

    // ---------------------------------------------------------------------------------------------
    // volunteerRoles
    // ---------------------------------------------------------------------------------------------

    injectPermissionTestsForAction(kVolunteerRolesDefinition, volunteerRoles, {
        request: {
            teamId: 0,
        },
        insufficientPrivileges: Privilege.EventApplicationManagement,
    });
});
