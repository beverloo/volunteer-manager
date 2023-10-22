// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Paper from '@mui/material/Paper';

import type { ExportMetadata } from './ExportMetadata';

/**
 * Props accepted by the <ExportAvailable> component.
 */
export interface ExportAvailableProps {
    /**
     * Metadata about the export that's being presented on this page.
     */
    metadata: ExportMetadata;
}

/**
 * The <ExportAvailable> component handles the case where the export data is available. The visitor
 * has to acknowledge that they want to access the data after which they can make an API call to
 * retrieve it. It will then be rendered client-side in their browser for consumption.
 */
export function ExportAvailable(props: ExportAvailableProps) {
    // TODO: (2) The export exists and is available, and can be accessed.
    // TODO: (3) The export exists and is available, and has been accessed.

    return (
        <Paper sx={{ p: 2, width: '75%', textAlign: 'center' }}>
            Not yet implemented.
        </Paper>
    );
}
