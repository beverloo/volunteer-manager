// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';
import { useContext, useMemo } from 'react';

import type { SxProps } from '@mui/system';
import type { Theme } from '@mui/material/styles';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import LocalActivityIcon from '@mui/icons-material/LocalActivity';
import NotesIcon from '@mui/icons-material/Notes';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { ErrorCard } from '../../components/ErrorCard';
import { ListItemDetails } from '../../components/ListItemDetails';
import { ScheduleContext } from '../../ScheduleContext';
import { Section } from '../../components/Section';
import { SetTitle } from '../../components/SetTitle';
import { SoldOutWarning } from '../../components/SoldOutWarning';
import { formatDate } from '@lib/Temporal';
import { currentTimestamp, toZonedDateTime } from '../../CurrentTime';
import { NotesCard } from '../../components/NotesCard';

import { kEnforceSingleLine } from '../../Constants';

/**
 * Information cached for a shift description box on the event page.
 */
interface DescriptionInfo {
    /**
     * Unique ID of the description box.
     */
    id: string;

    /**
     * Name of the team for whom the description is in scope.
     */
    team: string;

    /**
     * HTML colour that represents the identity of the aforementioned team.
     */
    teamColour: string;

    /**
     * Description associated with the shift. May contain Markdown.
     */
    description: string;
}

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

    /**
     * Whether the timeslot has finished already. Only included for sorting purposes.
     */
    finished: boolean;

    /**
     * Optional styling that should be applied to the timeslot entry.
     */
    sx?: SxProps<Theme>;
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

    /**
     * Whether the volunteer shift has finished already. Only included for sorting purposes.
     */
    finished: boolean;

    /**
     * Optional styling that should be applied to the volunteer entry.
     */
    sx?: SxProps<Theme>;
}

/**
 * Props accepted by the <EventPage>.
 */
interface EventPageProps {
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

    const [ descriptions, eventLocation, timeslots, timeslotsHidden, volunteers ] = useMemo(() => {
        const descriptions: DescriptionInfo[] = [ /* empty */ ];
        const timeslots: TimeslotInfo[] = [ /* empty */ ];
        const volunteers: VolunteerInfo[] = [ /* empty */ ];

        const currentTime = currentTimestamp();

        let eventLocation: string | undefined;
        let timeslotsHidden: boolean = false;

        if (!!schedule && schedule.program.activities.hasOwnProperty(props.activityId)) {
            const activity = schedule.program.activities[props.activityId];
            timeslotsHidden = !!activity.timeslotsHidden;

            for (const timeslotId of activity.timeslots) {
                const timeslot = schedule.program.timeslots[timeslotId];
                const location = schedule.program.locations[timeslot.location];

                if (!!eventLocation && eventLocation !== location.name)
                    eventLocation = 'Multiple locations…';
                else
                    eventLocation = location.name;

                let sx: SxProps<Theme> | undefined;
                if (timeslot.end <= currentTime) {
                    sx = {
                        backgroundColor: 'animecon.pastBackground',
                        textDecoration: 'line-through',
                        textDecorationColor: theme => theme.palette.animecon.pastForeground,
                        '&:hover': {
                            backgroundColor: 'animecon.pastBackgroundHover',
                            textDecoration: 'line-through',
                            textDecorationColor: theme => theme.palette.animecon.pastForeground,
                        },
                    };
                } else if (timeslot.start <= currentTime) {
                    sx = {
                        backgroundColor: 'animecon.activeBackground',
                        '&:hover': {
                            backgroundColor: 'animecon.activeBackgroundHover',
                        },
                    };
                }

                const start = toZonedDateTime(timeslot.start);
                const end = toZonedDateTime(timeslot.end);

                timeslots.push({
                    id: timeslotId,
                    href: `/schedule/${schedule.slug}/locations/${timeslot.location}`,
                    location: location.name,
                    timings: `${formatDate(start, 'ddd, HH:mm')}–${formatDate(end, 'HH:mm')}`,
                    startTime: timeslot.start,
                    finished: timeslot.end < currentTime,
                    sx,
                });
            }

            // Sort the timeslots by their date/time, in ascending order.
            timeslots.sort((lhs, rhs) => {
                if (schedule.config.sortPastEventsLast && lhs.finished !== rhs.finished)
                    return lhs.finished ? 1 : -1;

                return lhs.startTime - rhs.startTime;
            });

            const descriptionSet = new Set<string>;

            for (const scheduledShiftId of activity.schedule) {
                const scheduledShift = schedule.schedule[scheduledShiftId];

                const shift = schedule.shifts[scheduledShift.shift];
                const volunteer = schedule.volunteers[scheduledShift.volunteer];

                if (!!shift.description && !descriptionSet.has(shift.team)) {
                    const team = schedule.teams[shift.team];
                    descriptions.push({
                        id: shift.id,
                        team: team.name,
                        teamColour: team.colour,
                        description: shift.description,
                    });

                    descriptionSet.add(shift.team);
                }

                let sx: SxProps<Theme> | undefined;
                if (scheduledShift.end <= currentTime) {
                    sx = {
                        backgroundColor: 'animecon.pastBackground',
                        textDecoration: 'line-through',
                        textDecorationColor: theme => theme.palette.animecon.pastForeground,
                        '&:hover': {
                            backgroundColor: 'animecon.pastBackgroundHover',
                            textDecoration: 'line-through',
                            textDecorationColor: theme => theme.palette.animecon.pastForeground,
                        },
                    };
                } else if (scheduledShift.start <= currentTime) {
                    sx = {
                        backgroundColor: 'animecon.activeBackground',
                        '&:hover': {
                            backgroundColor: 'animecon.activeBackgroundHover',
                        },
                    };
                }

                const start = toZonedDateTime(scheduledShift.start);
                const end = toZonedDateTime(scheduledShift.end);

                volunteers.push({
                    id: scheduledShiftId,
                    href: `/schedule/${schedule.slug}/volunteers/${volunteer.id}`,
                    name: volunteer.name,
                    timings: `${formatDate(start, 'ddd, HH:mm')}–${formatDate(end, 'HH:mm')}`,
                    startTime: scheduledShift.start,
                    finished: scheduledShift.end < currentTime,
                    sx,
                });
            }

            // Sort the descriptions by the associated team's name, in ascending order.
            descriptions.sort((lhs, rhs) => lhs.team.localeCompare(rhs.team));

            // Sort the volunteers first by the date/time of their shift, in ascending order, then
            // by their name secondary.
            volunteers.sort((lhs, rhs) => {
                if (schedule.config.sortPastEventsLast && lhs.finished !== rhs.finished)
                    return lhs.finished ? 1 : -1;

                if (lhs.startTime === rhs.startTime)
                    return lhs.name.localeCompare(rhs.name);

                return lhs.startTime - rhs.startTime;
            });
        }

        return [
            descriptions,
            eventLocation ?? 'AnimeCon',
            timeslots,
            timeslotsHidden,
            volunteers
        ];

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
                            subheaderTypographyProps={{ sx: kEnforceSingleLine }}
                            subheader={eventLocation} />
            </Card>
            { descriptions.map(description =>
                <NotesCard key={description.id}
                           icon={ <NotesIcon htmlColor={description.teamColour} /> }
                           title={description.team}
                           notes={description.description} />  )}
            { (timeslots.length > 0 && !timeslotsHidden) &&
                <Section header="Timeslots">
                    <List dense disablePadding>
                        { timeslots.map(timeslot =>
                            <ListItemButton LinkComponent={Link} href={timeslot.href}
                                            key={timeslot.id} sx={timeslot.sx}>
                                <ListItemText primaryTypographyProps={{ sx: kEnforceSingleLine }}
                                              primary={timeslot.location} />
                                <ListItemDetails>
                                    {timeslot.timings}
                                </ListItemDetails>
                            </ListItemButton> )}
                    </List>
                </Section> }
            { (!!activity.products && activity.products.length > 0) &&
                <Section header="Ticket sales">
                    <List dense disablePadding>
                        { activity.products.map((product, index) =>
                            <ListItem key={index}>
                                <ListItemText primaryTypographyProps={{ sx: kEnforceSingleLine }}
                                              primary={product.product} />
                                <ListItemDetails>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                    { (!!product.limit && product.sold >= product.limit) &&
                                        <>
                                            <Typography variant="caption" color="error">
                                                sold out ({product.sold})
                                            </Typography>
                                            <LocalActivityIcon color="error" fontSize="small"
                                                               sx={{ pb: 0.25 }} />
                                        </> }
                                    { (!product.limit || product.sold < product.limit) &&
                                        <>
                                            <Typography variant="caption">
                                                { !product.limit && `${product.sold}` }
                                                { !!product.limit && `${product.sold} / ${product.limit}` }
                                            </Typography>
                                            <LocalActivityIcon color="action" fontSize="small"
                                                               sx={{ pb: 0.25 }} />
                                        </> }
                                    </Stack>
                                </ListItemDetails>
                            </ListItem> )}
                    </List>
                </Section> }
            { !!activity.soldOut && <SoldOutWarning /> }
            { !!volunteers.length &&
                <Section header="Volunteers">
                    <List dense disablePadding>
                        { volunteers.map(volunteer =>
                            <ListItemButton LinkComponent={Link} href={volunteer.href}
                                            key={volunteer.id} sx={volunteer.sx}>
                                <ListItemText primaryTypographyProps={{ sx: kEnforceSingleLine }}
                                              primary={volunteer.name} />
                                <ListItemDetails>
                                    {volunteer.timings}
                                </ListItemDetails>
                            </ListItemButton> )}
                    </List>
                </Section> }
        </>
    );
}
