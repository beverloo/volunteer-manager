// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useEffect, useState } from 'react';

import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import SettingsIcon from '@mui/icons-material/Settings';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

/**
 * Component that displays the current time, following the device's local timezone. It will update
 * every minute automatically, although the internal state is updated more frequently.
 */
function CurrentTime() {
    const [ date, setDate ] = useState(new Date);

    useEffect(() => {
        const timer = setInterval(() => setDate(new Date), /* 5 seconds= */ 5000);
        return () => clearInterval(timer);
    });

    return `${('0' + date.getHours()).substr(-2)}:${('0' + date.getMinutes()).substr(-2)}`;
}

/**
 * The <DisplayHeader> component displays the Display's header bar, which contains the logo, name,
 * current time and an overflow menu granting access to device configuration.
 */
export function DisplayHeader() {
    return (
        <Paper sx={{ px: 2, py: 1 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                <Typography variant="h5">
                    AnimeCon Volunteering Teams
                </Typography>
                <Stack direction="row" alignItems="center" spacing={2}
                       divider={ <Divider orientation="vertical" flexItem /> }>
                    <Typography variant="button" sx={{ pr: 1 }}>
                        <CurrentTime />
                    </Typography>
                    <IconButton>
                        <SettingsIcon />
                    </IconButton>
                </Stack>
            </Stack>
        </Paper>
    );
}
