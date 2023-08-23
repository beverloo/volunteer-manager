// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';

import { Google, type GoogleSettings } from './Google';
import { StatusHeader } from './StatusHeader';
import { Prompts, type PromptSettings } from './Prompts';
import { VertexAI, type VertexAISettings } from './VertexAI';
import { readSettings } from '@lib/Settings';

/**
 * The Integrations page lists settings and information regarding the third party services that the
 * Volunteer Manager integrates with.
 */
export default async function IntegrationsPage() {
    const settings = await readSettings([
        // Google:
        'integration-google-credentials',
        'integration-google-location',
        'integration-google-project-id',

        // Prompts:
        'integration-prompt-approve-volunteer',
        'integration-prompt-reject-volunteer',

        // Google Vertex AI:
        'integration-vertex-model',
        'integration-vertex-temperature',
        'integration-vertex-token-limit',
        'integration-vertex-top-k',
        'integration-vertex-top-p',
    ]);

    const googleSettings: GoogleSettings = {
        credential: settings['integration-google-credentials'] ?? '',
        location: settings['integration-google-location'] ?? '',
        projectId: settings['integration-google-project-id'] ?? '',
    };

    const promptSettings: PromptSettings = {
        approveVolunteer: settings['integration-prompt-approve-volunteer'] ?? '',
        rejectVolunteer: settings['integration-prompt-reject-volunteer'] ?? '',
    };

    const vertexSettings: VertexAISettings = {
        model: settings['integration-vertex-model'] ?? 'text-bison@001',
        temperature: settings['integration-vertex-temperature'] ?? 0.25,
        tokenLimit: settings['integration-vertex-token-limit'] ?? 256,
        topK: settings['integration-vertex-top-k'] ?? 40,
        topP: settings['integration-vertex-top-p'] ?? 0.8,
    };

    return (
        <>
            <StatusHeader />
            <Google settings={googleSettings} />
            <VertexAI settings={vertexSettings} />
            <Prompts settings={promptSettings} />
        </>
    );
}

export const metadata: Metadata = {
    title: 'Integrations',
};
