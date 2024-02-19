// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { WhatsAppClient } from './WhatsAppClient';
import { kMessageRequest } from './WhatsAppTypes';

import { composeVolunteerApplicationRequest } from './templates/VolunteerApplication';

describe('WhatsAppClient', () => {
    it('is able to validate all our templates', () => {
        const volunteerApplicationRequest = composeVolunteerApplicationRequest({
            to: '+3100000000',
            firstName: 'John',
            lastName: 'Doe',
            eventSlug: '2024',
            teamName: 'Stewards',
            teamSlug: 'stewards.team'
        });

        expect(() => kMessageRequest.parse(volunteerApplicationRequest)).not.toThrow();
    });
});
