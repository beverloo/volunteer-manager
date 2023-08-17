// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { Privilege } from '@app/lib/auth/Privileges';
import { executeActionForTests } from '../ActionTestSupport';
import { useMockConnection } from '@app/lib/database/Connection';

import { hotelCreate, kHotelCreateDefinition } from './hotelCreate';

describe('/api/admin/hotel-create', () => {
    const mockConnection = useMockConnection();

    it('requires administrator privileges', async () => {
        const guestResponse = await executeActionForTests(kHotelCreateDefinition, hotelCreate, {
            request: { event: '2024' },
            user: /* guest= */ undefined,
        });

        expect(guestResponse.ok).toBeFalsy();
        expect(guestResponse.status).toBe(/* Forbidden= */ 403);

        const userResponse = await executeActionForTests(kHotelCreateDefinition, hotelCreate, {
            request: { event: '2024' },
            user: {
                privileges: Privilege.EventContentOverride |
                            Privilege.VolunteerAdministrator,
            },
        });

        expect(userResponse.ok).toBeFalsy();
        expect(userResponse.status).toBe(/* Forbidden= */ 403);
    });

    it('requires a valid event', async () => {
        mockConnection.expect('selectOneRow');

        const response = await executeActionForTests(kHotelCreateDefinition, hotelCreate, {
            request: { event: 'invalid-event' },
            user: { privileges: Privilege.Administrator },
        });

        expect(response.ok).toBeTruthy();
        expect(await response.json()).toEqual({
            /* failure response */
        });
    });
});
