// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useContext } from 'react';

import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';

import { ErrorCard } from '../../components/ErrorCard';
import { ScheduleContext } from '../../ScheduleContext';
import { SetTitle } from '../../components/SetTitle';

/**
 * Props accepted by the <EventPage>.
 */
export interface EventPageProps {
    /**
     * Unique ID of the activity this page will be shown for.
     */
    activityId: string;
}

/**
 * The <EventPage> displays the information associated with a particular event, such as a tasting
 * or a movie showing. General information will be listed, as well as shift descriptions and
 * volunteers assigned to work at this location.
 */
export function EventPage(props: EventPageProps) {
    const { schedule } = useContext(ScheduleContext);

    // ---------------------------------------------------------------------------------------------

    if (!schedule || !schedule.program.activities.hasOwnProperty(props.activityId)) {
        return (
            <ErrorCard title="This event cannot be found!">
                The event that you tried to access cannot be found.
            </ErrorCard>
        );
    }

    const activity = schedule.program.activities[props.activityId];

    return (
        <>
            <SetTitle title={activity.title} />
            <Card>
                <CardHeader title={activity.title}
                            titleTypographyProps={{ variant: 'subtitle2' }}
                            subheader={activity.id} />
            </Card>
            { /* TODO: Shift descriptions */ }
            { /* TODO: Timeslots */ }
            { /* TODO: Volunteers */ }
        </>
    );
}
