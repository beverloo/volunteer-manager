// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { VertexAIClient, type VertexAIClientSettings } from './VertexAIClient';
import { readSettings } from '@lib/Settings';

/**
 * Gets an instance of the Vertex AI client with either the `settings` when given, or default
 * configuration loaded from the database when omitted.
 */
export async function createVertexAIClient(settings?: VertexAIClientSettings)
    : Promise<VertexAIClient>
{
    if (!settings) {
        const configuration = await readSettings([
            // Google:
            'integration-google-apikey',
            'integration-google-credentials',
            'integration-google-location',
            'integration-google-project-id',

            // Google Vertex AI:
            'integration-vertex-model',
            'integration-vertex-temperature',
            'integration-vertex-token-limit',
            'integration-vertex-top-k',
            'integration-vertex-top-p',
        ]);

        for (const [ key, value ] of Object.entries(configuration)) {
            if (value !== undefined)
                continue;

            throw new Error(`Unable to instantiate the Vertex AI client, missing setting ${key}`);
        }

        settings = {
            apiKey: configuration['integration-google-apikey']!,
            credentials: configuration['integration-google-credentials']!,
            location: configuration['integration-google-location']!,
            projectId: configuration['integration-google-project-id']!,

            model: configuration['integration-vertex-model']!,
            temperature: configuration['integration-vertex-temperature']!,
            tokenLimit: configuration['integration-vertex-token-limit']!,
            topK: configuration['integration-vertex-top-k']!,
            topP: configuration['integration-vertex-top-p']!,
        };
    }

    return new VertexAIClient(settings);
}
