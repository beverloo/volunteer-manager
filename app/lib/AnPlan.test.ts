// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { decryptParameters, encryptParameters } from './AnPlan';
import { getAnPlanActivityUrl, getAnPlanLocationUrl, getAnPlanTimeslotUrl } from './AnPlan';

describe('AnPlan', () => {
    it('is able to compose links to activities, locations and timeslots', () => {
        process.env.APP_ANPLAN_URL_KEY = 'g77TDgLy4x7WzVJz';  // random.org-generated value
        process.env.APP_ANPLAN_URL_IV = 'Ac5RSe4nmCscKTDz';  // random.org-generated value

        expect(getAnPlanActivityUrl(/* activityId= */ 42640)).toEqual(
            'https://anplan.animecon.nl/events?bkY4U1RPNklnV0kraUpiWnZqS2NtY2hnNmFjNGd5cURKcFE3R3hNTUZYYz0=');
        expect(getAnPlanLocationUrl(/* locationId= */ 5360)).toEqual(
            'https://anplan.animecon.nl/locations?a3Y4OHlvS0djZ2dlOVVDY1pieFR4RkhURFVzNVhZSk9pelRWRmRqUXpLRT0=');
        expect(getAnPlanTimeslotUrl(/* timeslotId= */ 103975)).toEqual(
            'https://anplan.animecon.nl/timeslots?L0kxdlE0ZG1tQVY4MEk1NUZkYmdxYVpOODdUbDA3YkFEZlN5eXR1UlZSUT0=');
    });

    it('is able to encrypt, decrypt and roundtrip parameters', () => {
        process.env.APP_ANPLAN_URL_KEY = 'g77TDgLy4x7WzVJz';  // random.org-generated value
        process.env.APP_ANPLAN_URL_IV = 'Ac5RSe4nmCscKTDz';  // random.org-generated value

        expect(decryptParameters('bkY4U1RPNklnV0kraUpiWnZqS2NtY2hnNmFjNGd5cURKcFE3R3hNTUZYYz0='))
            .toEqual({ action: 'show', id: '42640' });

        expect(encryptParameters({ action: 'show', id: 5360 })).toEqual(
            'a3Y4OHlvS0djZ2dlOVVDY1pieFR4RkhURFVzNVhZSk9pelRWRmRqUXpLRT0=');

        const inputObject = {
            value: 12345,
            filter: true,
            name: 'example',
        };

        const roundtripObject = decryptParameters(encryptParameters(inputObject));
        expect(roundtripObject).toEqual({
            value: '12345',
            filter: 'true',
            name: 'example',
        });
    });
});
