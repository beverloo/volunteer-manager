// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Paper from '@mui/material/Paper';

import type { TrainingsDataExport } from '@app/api/exports/route';

/**
 * Props accepted by the <ExportTrainings> component.
 */
export interface ExportTrainingsProps {
    /**
     * The training data export that should be rendered by this component.
     */
    trainings: TrainingsDataExport;
}

/**
 * The <ExportTrainings> component displays participation information in the Steward Trainings that
 * we organise for part of our team each year. The data is obtained from the server.
 */
export function ExportTrainings(props: ExportTrainingsProps) {
    return (
        <Paper sx={{ p: 2 }}>
            (to be implemented)
        </Paper>
    );
}
