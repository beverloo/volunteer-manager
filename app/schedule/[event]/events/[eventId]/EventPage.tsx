// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';
import { useContext } from 'react';

import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';

import { ErrorCard } from '../../components/ErrorCard';
import { ListItemDetails } from '../../components/ListItemDetails';
import { ScheduleContext } from '../../ScheduleContext';
import { SetTitle } from '../../components/SetTitle';
import { SubHeader } from '../../components/SubHeader';
import { formatDate } from '@lib/Temporal';
import { toZonedDateTime } from '../../CurrentTime';

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
            { !!activity.timeslots.length &&
                <>
                    <SubHeader>Timeslots</SubHeader>
                    <Card sx={{ mt: '8px !important' }}>
                        <List dense disablePadding>
                            { activity.timeslots.map(timeslotId => {
                                const timeslot = schedule.program.timeslots[timeslotId];
                                const location = schedule.program.locations[timeslot.location];

                                const start = toZonedDateTime(timeslot.start);
                                const end = toZonedDateTime(timeslot.end);

                                const href =
                                    `/schedule/${schedule.slug}/locations/${timeslot.location}`;

                                return (
                                    <ListItemButton LinkComponent={Link} href={href}
                                                    key={timeslotId}>
                                        <ListItemText primary={location.name} />
                                        <ListItemDetails>
                                            { formatDate(start, 'ddd, HH:mm') }–
                                            { formatDate(end, 'HH:mm') }
                                        </ListItemDetails>
                                    </ListItemButton>
                                );
                            } )}
                        </List>
                    </Card>
                </> }
            { /* TODO: Volunteers */ }
        </>
    );
}
