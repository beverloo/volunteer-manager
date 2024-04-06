// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { TwilioClient, type TwilioSettings } from './TwilioClient';
import { readSettings } from '@lib/Settings';

/**
 * Gets an instance of the Twilio client with either the `settings` when given, or default
 * configuration loaded from the database when omitted.
 */
export async function createTwilioClient(settings?: TwilioSettings): Promise<TwilioClient> {
    if (!settings) {
        const configuration = await readSettings([
            'integration-twilio-account-auth-token',
            'integration-twilio-account-sid',
            'integration-twilio-phone-number',
            'integration-twilio-region',
        ]);

        for (const [ key, value ] of Object.entries(configuration)) {
            if (key === 'integration-twilio-region')
                continue;  // optional

            if (value !== undefined)
                continue;

            throw new Error(`Unable to instantiate the Twilio client, missing setting ${key}`);
        }

        settings = {
            accountSid: configuration['integration-twilio-account-sid']!,
            accountAuthToken: configuration['integration-twilio-account-auth-token']!,
            phoneNumber: configuration['integration-twilio-phone-number']!,
            region: configuration['integration-twilio-region'],
        };
    }

    return new TwilioClient(settings);
}
