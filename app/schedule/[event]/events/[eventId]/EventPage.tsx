// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';
import { useContext, useMemo } from 'react';

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
 * Information cached for a timeslot entry on the event page.
 */
interface TimeslotInfo {
    /**
     * Unique ID of the timeslot.
     */
    id: string;

    /**
     * URL that contains more information about this particular location.
     */
    href: string;

    /**
     * Location in which the timeslot will be hosted.
     */
    location: string;

    /**
     * Timings of the timeslot, i.e. when does it start and finish?
     */
    timings: string;

    /**
     * UNIX timestamp of the time at which this timeslot starts. Only included for sorting purposes.
     */
    startTime: number;
}

/**
 * Information cached for a volunteer entry on the event page.
 */
interface VolunteerInfo {
    /**
     * Unique ID of the volunteer.
     */
    id: string;

    /**
     * URL that contains more information about this particular volunteer.
     */
    href: string;

    /**
     * Name of the volunteer as is appropriate to present to other volunteers.
     */
    name: string;

    /**
     * Timings of the shift, i.e. when does it start and finish?
     */
    timings: string;

    /**
     * UNIX timestamp of the time at which this shift starts. Only included for sorting purposes.
     */
    startTime: number;
}

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

    const [ timeslots, volunteers ] = useMemo(() => {
        const timeslots: TimeslotInfo[] = [ /* empty */ ];
        const volunteers: VolunteerInfo[] = [ /* empty */ ];

        if (!!schedule && schedule.program.activities.hasOwnProperty(props.activityId)) {
            const activity = schedule.program.activities[props.activityId];

            for (const timeslotId of activity.timeslots) {
                const timeslot = schedule.program.timeslots[timeslotId];
                const location = schedule.program.locations[timeslot.location];

                const start = toZonedDateTime(timeslot.start);
                const end = toZonedDateTime(timeslot.end);

                timeslots.push({
                    id: timeslotId,
                    href: `/schedule/${schedule.slug}/locations/${timeslot.location}`,
                    location: location.name,
                    timings: `${formatDate(start, 'ddd, HH:mm')}–${formatDate(end, 'HH:mm')}`,
                    startTime: timeslot.start,
                });
            }

            // Sort the timeslots by their date/time, in ascending order.
            timeslots.sort((lhs, rhs) => lhs.startTime - rhs.startTime);

            for (const scheduledShiftId of activity.schedule) {
                const scheduledShift = schedule.schedule[scheduledShiftId];
                const volunteer = schedule.volunteers[scheduledShift.volunteer];

                const start = toZonedDateTime(scheduledShift.start);
                const end = toZonedDateTime(scheduledShift.end);

                volunteers.push({
                    id: scheduledShiftId,
                    href: `/schedule/${schedule.slug}/volunteers/${volunteer.id}`,
                    name: volunteer.name,
                    timings: `${formatDate(start, 'ddd, HH:mm')}–${formatDate(end, 'HH:mm')}`,
                    startTime: scheduledShift.start,
                });
            }

            // Sort the volunteers first by the date/time of their shift, in ascending order, then
            // by their name secondary.
            volunteers.sort((lhs, rhs) => {
                if (lhs.startTime === rhs.startTime)
                    return lhs.name.localeCompare(rhs.name);

                // TODO: Sort past shifts to the bottom of this list
                return lhs.startTime - rhs.startTime;
            });
        }

        return [ timeslots, volunteers ];

    }, [ props.activityId, schedule ]);

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
            { !!timeslots &&
                <>
                    <SubHeader>Timeslots</SubHeader>
                    <Card sx={{ mt: '8px !important' }}>
                        <List dense disablePadding>
                            { timeslots.map(timeslot =>
                                <ListItemButton LinkComponent={Link} href={timeslot.href}
                                                key={timeslot.id}>
                                    <ListItemText primary={timeslot.location} />
                                    <ListItemDetails>
                                        {timeslot.timings}
                                    </ListItemDetails>
                                </ListItemButton> )}
                        </List>
                    </Card>
                </> }
            { !!volunteers.length &&
                <>
                    <SubHeader>Volunteers</SubHeader>
                    <Card sx={{ mt: '8px !important' }}>
                        <List dense disablePadding>
                            { volunteers.map(volunteer =>
                                <ListItemButton LinkComponent={Link} href={volunteer.href}
                                                key={volunteer.id}>
                                    <ListItemText primary={volunteer.name} />
                                    <ListItemDetails>
                                        {volunteer.timings}
                                    </ListItemDetails>
                                </ListItemButton> )}
                        </List>
                    </Card>
                </> }
        </>
    );
}
