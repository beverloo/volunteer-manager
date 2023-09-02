// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Paper from '@mui/material/Paper';

/**
 * Props accepted by the <EventIdentityCard> component.
 */
export interface EventIdentityCardProps {
    // TODO
}

/**
 * The <EventDateCard> component displays the event's logo in a styled, aspect-ratio'd box. This
 * should help as a quick indication to the volunteer about which event is being displayed.
 */
export function EventIdentityCard(props: EventIdentityCardProps) {
    return (
        <Paper sx={{ aspectRatio: 1.25, p: 2 }}>
            EventIdentityCard
        </Paper>
    );
}
