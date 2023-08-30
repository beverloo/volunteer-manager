// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import type { PageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';

/**
 * Props accepted by the <EventSettings> component.
 */
export interface EventSettingsProps {
    /**
     * Information about the event whose settings are being changed.
     */
    event: PageInfo['event'];
}

/**
 * The <EventSettings> component allows the administrator to change settings about the event itself,
 * such as its name, slug and dates over which it will take.
 */
export function EventSettings(props: EventSettingsProps) {
    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5">
                Event settings
            </Typography>
        </Paper>
    );
}
