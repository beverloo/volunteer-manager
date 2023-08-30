// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import type { PageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';

/**
 * Props accepted by the <TeamSettings> component.
 */
export interface TeamSettingsProps {
    /**
     * Information about the event whose settings are being changed.
     */
    event: PageInfo['event'];
}

/**
 * The <TeamSettings> component allows administrators to change settings regarding the individual
 * teams that take part in an event. Team settings include availability of content, the schedule, as
 * well as targets regarding the number of volunteers that should participate.
 */
export function TeamSettings(props: TeamSettingsProps) {
    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5">
                Team settings
            </Typography>
        </Paper>
    );
}
