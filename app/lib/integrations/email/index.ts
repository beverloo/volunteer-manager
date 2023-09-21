// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type EmailClientSettings, EmailClient } from './EmailClient';
import { readSettings } from '@lib/Settings';

/**
 * Gets an instance of the e-mail client infrastructure, which allows messages to be sent across
 * the internet. Settings are stored in the Integration section.
 */
export async function createEmailClient(settings?: EmailClientSettings): Promise<EmailClient> {
    if (!settings) {
        const configuration = await readSettings([
            'integration-email-smtp-hostname',
            'integration-email-smtp-port',
            'integration-email-smtp-username',
            'integration-email-smtp-password',
        ]);

        for (const [ key, value ] of Object.entries(configuration)) {
            if (value !== undefined)
                continue;

            throw new Error(`Unable to instantiate the e-mail client, missing setting ${key}`);
        }

        settings = {
            hostname: configuration['integration-email-smtp-hostname']!,
            port: configuration['integration-email-smtp-port']!,
            username: configuration['integration-email-smtp-username']!,
            password: configuration['integration-email-smtp-password']!,
        };
    }

    return new EmailClient(settings);
}
