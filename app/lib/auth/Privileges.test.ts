// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { User } from '@lib/auth/User';
import { AuthType } from '@lib/database/Types';
import { Privilege, can, expand } from './Privileges';


describe('Privileges', () => {
    const kUserWithoutPrivileges: Omit<User, 'privileges'> = {
        userId: 2000000,
        username: 'joe@example.com',
        firstName: 'Joe',
        lastName: 'Example',
    };

    it('has the ability to perform basic access checks', () => {
        const user: User = {
            ...kUserWithoutPrivileges,
            privileges: BigInt(Privilege.Statistics),
        };

        // (1) Guests aren't granted any permissions by default.
        expect(can(/* user= */ undefined, Privilege.Statistics)).toBeFalse();

        // (2) Users have their `privileges` bit checked.
        expect(can(user, Privilege.EventAdministrator)).toBeFalse();
        expect(can(user, Privilege.Statistics)).toBeTrue();
    });

    it('has the ability to expand privilege groups into individual privileges', () => {
        const unexpandedUser: User = {
            ...kUserWithoutPrivileges,
            privileges: BigInt(Privilege.EventAdministrator),
        };

        const expandedUser: User = {
            ...kUserWithoutPrivileges,
            privileges: expand(BigInt(Privilege.EventAdministrator)),
        };

        const doubleExpandedUser: User = {
            ...kUserWithoutPrivileges,
            privileges: expand(BigInt(Privilege.Administrator)),
        };

        // (1) All users should have their immediately granted permission.
        expect(can(unexpandedUser, Privilege.EventAdministrator)).toBeTrue();
        expect(can(expandedUser, Privilege.EventAdministrator)).toBeTrue();
        expect(can(doubleExpandedUser, Privilege.Administrator)).toBeTrue();

        // (2) Single-level expansion should work when applicable.
        expect(can(unexpandedUser, Privilege.EventApplicationManagement)).toBeFalse();
        expect(can(expandedUser, Privilege.EventApplicationManagement)).toBeTrue();
        expect(can(doubleExpandedUser, Privilege.EventAdministrator)).toBeTrue();

        // (3) Double-level expansion should work when applicable.
        expect(can(doubleExpandedUser, Privilege.EventApplicationManagement)).toBeTrue();
    });
});
