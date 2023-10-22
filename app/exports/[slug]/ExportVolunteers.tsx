// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Paper from '@mui/material/Paper';

import type { VolunteersDataExport } from '@app/api/exports/route';

/**
 * Props accepted by the <ExportVolunteers> component.
 */
export interface ExportVolunteersProps {
    /**
     * The volunteer data export that should be rendered by this component.
     */
    volunteers: VolunteersDataExport;
}

/**
 * The <ExportVolunteers> component displays a comprehensive, sorted list of volunteers who are
 * participating in a particular event. All metadata required by the broader AnimeCon organisation
 * is included in the export.
 */
export function ExportVolunteers(props: ExportVolunteersProps) {
    return (
        <Paper sx={{ p: 2 }}>
            (to be implemented)
        </Paper>
    );
}
