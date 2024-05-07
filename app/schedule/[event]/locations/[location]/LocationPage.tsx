// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';
import React, { useContext, useMemo } from 'react';

import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import EditNoteIcon from '@mui/icons-material/EditNote';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import NotesIcon from '@mui/icons-material/Notes';
import PhoneIcon from '@mui/icons-material/Phone';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

import { ErrorCard } from '../../components/ErrorCard';
import { ListItemDetails } from '../../components/ListItemDetails';
import { ScheduleContext } from '../../ScheduleContext';
import { SetTitle } from '../../components/SetTitle';
import { SubHeader } from '../../components/SubHeader';
import { formatDate } from '@lib/Temporal';
import { toZonedDateTime } from '../../CurrentTime';

import { kLogicalDayChangeHour } from '../../lib/isDifferentDay';
import { redirect } from 'next/navigation';

/**
 * Information associated with a particular section of timeslots, generally days.
 */
interface TimeslotSectionInfo {
    /**
     * Label to assign to the section of timeslots.
     */
    label: string;

    /**
     * The timeslots that are part of this section.
     */
    timeslots: {
        /**
         * Unique ID of this timeslot.
         */
        id: string;

        /**
         * Unique ID of the activity associated with this timeslot.
         */
        activityId: string;

        /**
         * Name of the activity that will be taking place during this timeslot.
         */
        activity: string;

        /**
         * Time at which the timeslot will start.
         */
        start: string;

        /**
         * Time at which the timeslot will finish.
         */
        end: string;

        /**
         * UNIX timestamp of the time when this timeslots is due to start. Only included to enable
         * sorting the results.
         */
        startTime: number;
    }[];
}

/**
 * Props accepted by the <LocationPage>.
 */
export interface LocationPageProps {
    /**
     * Unique ID of the location to display on this page.
     */
    locationId: string;
}

/**
 * The <LocationPage> displays the activities that will be taking place in a particular location.
 * When only one such activity exists, the user will be redirected through immediately.
 */
export function LocationPage(props: LocationPageProps) {
    const { schedule } = useContext(ScheduleContext);

    // ---------------------------------------------------------------------------------------------

    const [ sections, soleActivityId ] = useMemo(() => {
        const sections: TimeslotSectionInfo[] = [ /* empty */ ];
        if (!schedule || !schedule.program.locations.hasOwnProperty(props.locationId))
            return [ sections, null ];

        const activities = new Set<string>;
        const timeslotsSections = new Map<string, TimeslotSectionInfo['timeslots'][number][]>;

        for (const timeslotId of schedule.program.locations[props.locationId].timeslots) {
            const timeslot = schedule.program.timeslots[timeslotId];
            const activity = schedule.program.activities[timeslot.activity];

            activities.add(timeslot.activity);

            const start = toZonedDateTime(timeslot.start);
            const end = toZonedDateTime(timeslot.end);

            // We consider timeslots that end before the `kLogicalDayChangeHour` to be part of the
            // previous day, to avoid confusion about when events will actually be happening.
            let startForSection = start;
            if (!!schedule.config.enableLogicalDays && end.hour <= kLogicalDayChangeHour)
                startForSection = start.subtract({ hours: kLogicalDayChangeHour });

            const section = formatDate(startForSection, 'dddd');
            if (!timeslotsSections.has(section))
                timeslotsSections.set(section, [ /* empty */ ]);

            timeslotsSections.get(section)!.push({
                id: timeslotId,
                activityId: timeslot.activity,
                activity: activity.title,
                start: formatDate(start, 'HH:mm'),
                startTime: timeslot.start,
                end: formatDate(end, 'HH:mm'),
            });
        }

        for (const [ label, timeslots ] of timeslotsSections.entries()) {
            sections.push({
                label,
                timeslots: timeslots.sort((lhs, rhs) => {
                    // TODO: Sort timeslots that have passed to the bottom of the list.
                    return lhs.startTime - rhs.startTime;
                }),
            });
        }

        sections.sort((lhs, rhs) => {
            // TODO: Sort timeslot sections that have passed to the bottom of the list.
            return lhs.timeslots[0].startTime - rhs.timeslots[0].startTime;
        });

        return [
            sections,
            activities.size === 1 ? [ ...activities ][0] : null,
        ];

    }, [ props.locationId, schedule ]);

    // ---------------------------------------------------------------------------------------------

    if (!schedule || !schedule.program.locations.hasOwnProperty(props.locationId)) {
        return (
            <ErrorCard title="This location cannot be found!">
                The location that you tried to access cannot be found.
            </ErrorCard>
        );
    }

    // If this location only hosts a single activity, forward the user through to the activity page
    // as it will contain the useful information, making this page redundant.
    if (!!soleActivityId)
        redirect(`/schedule/${schedule.slug}/events/${soleActivityId}`);

    const location = schedule.program.locations[props.locationId];
    const area = schedule.program.areas[location.area];

    return (
        <>
            <SetTitle title={location.name} />
            <Card>
                <CardHeader title={location.name}
                            titleTypographyProps={{ variant: 'subtitle2' }}
                            subheader={area.name} />
            </Card>
            { !sections.length &&
                <ErrorCard title="No scheduled events">
                    This location will not be hosting any events.
                </ErrorCard> }
            { sections.map(section =>
                <React.Fragment key={section.label}>
                    <SubHeader>{section.label}</SubHeader>
                    <Card sx={{ mt: '8px !important' }}>
                        <List dense disablePadding>
                            {section.timeslots.map(timeslot => {
                                const href =
                                    `/schedule/${schedule.slug}/events/${timeslot.activityId}`;

                                return (
                                    <ListItemButton LinkComponent={Link} href={href}
                                                    key={timeslot.id}>
                                        <ListItemText primary={timeslot.activity} />
                                        <ListItemDetails>
                                            {timeslot.start}–{timeslot.end}
                                        </ListItemDetails>
                                    </ListItemButton>
                                );
                            } )}
                        </List>
                    </Card>
                </React.Fragment> )}
        </>
    );
}
