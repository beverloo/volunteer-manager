// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { AnimeConClient, type AnimeConClientSettings } from './AnimeConClient';
import { readSettings } from '@lib/Settings';

/**
 * Re-export the primary types that consumers of this integration would interact with.
 */
export { AnimeConClient };
export { Program } from './Program';
export { comparePrograms } from './ProgramComparison';
export * from './AnimeConTypes';

/**
 * Gets an instance of the AnimeCon client with either the `settings` when given, or default
 * configuration loaded from the database when omitted.
 */
export async function createAnimeConClient(settings?: AnimeConClientSettings)
    : Promise<AnimeConClient>
{
    if (!settings) {
        const configuration = await readSettings([
            'integration-animecon-api-endpoint',
            'integration-animecon-auth-endpoint',
            'integration-animecon-client-id',
            'integration-animecon-client-secret',
            'integration-animecon-username',
            'integration-animecon-password',
            'integration-animecon-scopes',
        ]);

        for (const [ key, value ] of Object.entries(configuration)) {
            if (value !== undefined)
                continue;

            throw new Error(`Unable to instantiate the AnimeCon client, missing setting ${key}`);
        }

        settings = {
            apiEndpoint: configuration['integration-animecon-api-endpoint']!,
            authEndpoint: configuration['integration-animecon-auth-endpoint']!,
            clientId: configuration['integration-animecon-client-id']!,
            clientSecret: configuration['integration-animecon-client-secret']!,
            username: configuration['integration-animecon-username']!,
            password: configuration['integration-animecon-password']!,
            scopes: configuration['integration-animecon-scopes']!,
        };
    }

    return new AnimeConClient(settings);
}
