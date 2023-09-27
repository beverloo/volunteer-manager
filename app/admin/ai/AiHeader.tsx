// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

/**
 * Displays a header that can be consistent across the multiple Generative AI-related pages.
 */
export function AiHeader() {
    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ mb: 1 }}>
                Generative AI
            </Typography>
            <Alert severity="info">
                While the AnimeCon Volunteer Manager uses generative AI to draft messages to
                volunteers, leads will always have the ability to overwrite them. Personality is
                shared across the individual prompts, which are specific to context that will be
                added programmatically.
            </Alert>
        </Paper>
    );
}
