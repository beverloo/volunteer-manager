// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Paper from '@mui/material/Paper';

/**
 * Props accepted by the <EventTimeline> component.
 */
export interface EventTimelineProps {
    // TODO
}

/**
 * The <EventTimeline> component displays a timeline of the event and all the intermediary steps
 * at which actions are scheduled to happen. A quick reminder of what's to home.
 */
export function EventTimeline(props: EventTimelineProps) {
    return (
        <Paper sx={{ p: 2 }}>
            EventTimeline
        </Paper>
    );
}
