// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Paper from '@mui/material/Paper';

import type { CreditsDataExport } from '@app/api/exports/route';

/**
 * Props accepted by the <ExportCredits> component.
 */
export interface ExportCreditsProps {
    /**
     * The credit data export that should be rendered by this component.
     */
    credits: CreditsDataExport;
}

/**
 * The <ExportCredits> component lists the volunteers who want their name to be included in the
 * credit reel, as well as the volunteers who decidedly do not want their name to be included.
 */
export function ExportCredits(props: ExportCreditsProps) {
    return (
        <Paper sx={{ p: 2 }}>
            (to be implemented)
        </Paper>
    );
}
