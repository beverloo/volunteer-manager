// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type Metadata } from 'next';

import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import { Google, GoogleSettings } from './Google';
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

    const vertexSettings: VertexAISettings = {
        model: settings['integration-vertex-model'] ?? 'text-bison@001',
        temperature: settings['integration-vertex-temperature'] ?? 0.25,
        tokenLimit: settings['integration-vertex-token-limit'] ?? 256,
        topK: settings['integration-vertex-top-k'] ?? 40,
        topP: settings['integration-vertex-top-p'] ?? 0.8,
    };

    return (
        <>
            <Paper sx={{ p: 2 }}>
                <Typography variant="h5">
                    Integrations
                </Typography>
            </Paper>
            <Google settings={googleSettings} />
            <VertexAI settings={vertexSettings} />
        </>
    );
}

export const metadata: Metadata = {
    title: 'Integrations',
};
