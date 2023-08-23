// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { Privilege } from '@app/lib/auth/Privileges';
import { executeActionForTests, injectPermissionTestsForAction } from '../../ActionTestSupport';
import { useMockConnection } from '@app/lib/database/Connection';

import { hotelCreate, kHotelCreateDefinition } from '../hotelCreate';
import { hotelDelete, kHotelDeleteDefinition } from '../hotelDelete';
import { hotelUpdate, kHotelUpdateDefinition } from '../hotelUpdate';
import { logs, kLogsDefinition } from '../logs';
import { resetAccessCode, kResetAccessCodeDefinition } from '../resetAccessCode';
import { resetPasswordLink, kResetPasswordLinkDefinition } from '../resetPasswordLink';
import { updateActivation, kUpdateActivationDefinition } from '../updateActivation';
import { updatePermissions, kUpdatePermissionsDefinition } from '../updatePermissions';
import { updateVolunteer, kUpdateVolunteerDefinition } from '../updateVolunteer';
import { volunteerRoles, kVolunteerRolesDefinition } from '../volunteerRoles';

describe('API Endpoints: /api/admin', () => {
    const mockConnection = useMockConnection();

    // ---------------------------------------------------------------------------------------------
    // hotelCreate
    // ---------------------------------------------------------------------------------------------

    injectPermissionTestsForAction(kHotelCreateDefinition, hotelCreate, {
        request: { event: '2024' },
        insufficientPrivileges: Privilege.EventContentOverride |
                                Privilege.VolunteerAdministrator
    });

    it('requires a valid event', async () => {
        mockConnection.expect('selectOneRow');

        const response = await executeActionForTests(kHotelCreateDefinition, hotelCreate, {
            request: { event: 'invalid-event' },
            user: { privileges: BigInt(Privilege.Administrator) },
        });

        expect(response.ok).toBeTruthy();
        expect(await response.json()).toEqual({
            /* failure response */
        });
    });

    // ---------------------------------------------------------------------------------------------
    // hotelDelete
    // ---------------------------------------------------------------------------------------------

    injectPermissionTestsForAction(kHotelDeleteDefinition, hotelDelete, {
        request: { event: '2024', id: 42 },
        insufficientPrivileges: Privilege.EventContentOverride |
                                Privilege.VolunteerAdministrator
    });

    // ---------------------------------------------------------------------------------------------
    // hotelUpdate
    // ---------------------------------------------------------------------------------------------

    injectPermissionTestsForAction(kHotelUpdateDefinition, hotelUpdate, {
        request: {
            event: '2024',
            id: 42,
            hotelDescription: 'Example description',
            hotelName: 'Example name',
            roomName: 'Example room',
            roomPeople: 2,
            roomPrice: 18000,
        },
        insufficientPrivileges: Privilege.EventContentOverride |
                                Privilege.VolunteerAdministrator
    });

    // ---------------------------------------------------------------------------------------------
    // logs
    // ---------------------------------------------------------------------------------------------

    injectPermissionTestsForAction(kLogsDefinition, logs, {
        request: { page: 0, pageSize: 25 },
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
