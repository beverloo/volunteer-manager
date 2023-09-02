// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Grid from '@mui/material/Unstable_Grid2';

import { EventIdentityCard } from './EventIdentityCard';
import { EventTeamCard, type EventTeamCardProps } from './EventTeamCard';
import { EventTimeline } from './EventTimeline';

/**
 * Props accepted by the <EventDashboard> component.
 */
export interface EventDashboardProps {
    /**
     * Teams that participate in this event, each with meta-information that can be displayed on
     * the <EventTeamCard> objects.
     */
    teams: EventTeamCardProps[];
}

/**
 * The <EventDashboard> component displays the pseudo-masonry of cards carrying information that are
 * useful for the leads to know about. It's less detailed than the statistics sub-app.
 */
export function EventDashboard(props: EventDashboardProps) {
    return (
        <Grid container spacing={2} sx={{ m: '-8px !important' }}>
            <Grid xs={3}>
                <EventIdentityCard />
            </Grid>
            { props.teams.map((team, index) =>
                <Grid key={`team-${index}`} xs={3}>
                    <EventTeamCard {...team} />
                </Grid> ) }

            <Grid xs={12}>
                <EventTimeline />
            </Grid>
        </Grid>
    );
}
