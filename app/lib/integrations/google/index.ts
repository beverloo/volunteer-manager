// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { GoogleClient, type GoogleClientSettings } from './GoogleClient';
import { readSettings } from '@lib/Settings';

/**
 * Gets an instance of the Google client with either the `settings` when given, or default
 * configuration loaded from the database when omitted.
 */
export async function createGoogleClient(settings?: GoogleClientSettings): Promise<GoogleClient> {
    if (!settings) {
        const configuration = await readSettings([
            'integration-google-apikey',
            'integration-google-credentials',
            'integration-google-location',
            'integration-google-project-id',
        ]);

        for (const [ key, value ] of Object.entries(configuration)) {
            if (value !== undefined)
                continue;

            throw new Error(`Unable to instantiate the Google client, missing setting ${key}`);
        }

        settings = {
            apiKey: configuration['integration-google-apikey']!,
            credentials: configuration['integration-google-credentials']!,
            location: configuration['integration-google-location']!,
            projectId: configuration['integration-google-project-id']!,
        };
    }

    return new GoogleClient(settings);
}
