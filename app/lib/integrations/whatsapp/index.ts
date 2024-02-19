// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { WhatsAppClient, type WhatsAppSettings } from './WhatsAppClient';
import { readSettings } from '@lib/Settings';

/**
 * Gets an instance of the WhatsApp client with either the `settings` when given, or default
 * configuration loaded from the database when omitted.
 */
export async function createWhatsAppClient(settings?: WhatsAppSettings): Promise<WhatsAppClient> {
    if (!settings) {
        const configuration = await readSettings([
            'whatsapp-access-token',
            'whatsapp-phone-number-id',
        ]);

        for (const [ key, value ] of Object.entries(configuration)) {
            if (value !== undefined)
                continue;

            throw new Error(`Unable to instantiate the WhatsApp client, missing setting ${key}`);
        }

        settings = {
            accessToken: configuration['whatsapp-access-token']!,
            phoneNumberId: configuration['whatsapp-phone-number-id']!,
        };
    }

    return new WhatsAppClient(settings);
}
