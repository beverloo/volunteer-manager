// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Grid from '@mui/material/Unstable_Grid2';

import type { PageInfo } from '../verifyAccessAndFetchPageInfo';
import { EventIdentityCard } from './EventIdentityCard';
import { EventRecentVolunteers, type EventRecentVolunteersProps } from './EventRecentVolunteers';
import { EventSeniors } from './EventSeniors';
import { EventTeamCard, type EventTeamCardProps } from './EventTeamCard';
import { EventTimeline } from './EventTimeline';

/**
 * Props accepted by the <EventDashboard> component.
 */
export interface EventDashboardProps {
    /**
     * Information about the event for which the dashboard is being shown.
     */
    event: PageInfo['event'];

    /**
     * Most recent volunteers who applied to participate in this event.
     */
    recentVolunteers: EventRecentVolunteersProps['volunteers'];

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
    const { event } = props;

    return (
        <Grid container spacing={2} sx={{ m: '-8px !important' }}>
            <Grid xs={3}>
                <EventIdentityCard event={event} />
            </Grid>
            { props.teams.map((team, index) =>
                <Grid key={`team-${index}`} xs={3}>
                    <EventTeamCard {...team} />
                </Grid> ) }

            <Grid xs={12}>
                <EventTimeline />
            </Grid>

            { props.recentVolunteers.length &&
                <Grid xs={6}>
                    <EventRecentVolunteers event={event} volunteers={props.recentVolunteers} />
                </Grid> }

            <Grid xs={6}>
                <EventSeniors />
            </Grid>
        </Grid>
    );
}
