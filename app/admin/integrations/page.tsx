// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type Metadata } from 'next';

import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import { VertexAI, type VertexAISettings } from './VertexAI';

/**
 * The Integrations page lists settings and information regarding the third party services that the
 * Volunteer Manager integrates with.
 */
export default async function IntegrationsPage() {
    // TODO: Fetch the settings from the database.
    const settings: VertexAISettings = {
        model: 'text-bison@001',
        temperature: 0.25,
        tokenLimit: 256,
        topK: 40,
        topP: 0.8,
    };

    return (
        <>
            <Paper sx={{ p: 2 }}>
                <Typography variant="h5">
                    Integrations
                </Typography>
            </Paper>
            <VertexAI settings={settings} />
        </>
    );
}

export const metadata: Metadata = {
    title: 'Integrations',
};
