// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { DisplayShiftInfo } from '../DisplayContext';

/**
 * Props accepted by the <ActiveVolunteersCard> component.
 */
export interface ActiveVolunteersCardProps {
    /**
     * Timezone in which any times should be displayed in the user interface.
     */
    timezone: string;

    /**
     * Volunteers that are currently active within this location.
     */
    volunteers: DisplayShiftInfo[];
}

/**
 * The <ActiveVolunteersCard> component shows the volunteers who are currently scheduled on this
 * shift, and are expected to be around. All information about these volunteers will be shown.
 */
export function ActiveVolunteersCard(props: ActiveVolunteersCardProps) {
    const { volunteers } = props;

    return (
        <Stack component={Paper} variant="outlined" alignItems="center" justifyContent="center"
               sx={{
                   minHeight: '231px',  // aligned with the "request help" card
                   backgroundColor: 'rgba(255, 255, 255, 0.02)',
                   borderStyle: 'dashed',
                   p: 2
               }}>
            <Typography sx={{ color: 'text.disabled' }}>
                [ ActiveVolunteersCard ]
            </Typography>
        </Stack>
    );
}
