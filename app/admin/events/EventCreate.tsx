// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

/**
 * Props accepted by the <EventCreate> component.
 */
export interface EventCreateProps {

}

/**
 * The <EventCreate> component enables certain volunteers to create new events on the fly. While
 * this happens roughly once per year, this panel doesn't take too much time to support.
 */
export function EventCreate(props: EventCreateProps) {

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5">
                Create new event
            </Typography>
        </Paper>
    );
}
