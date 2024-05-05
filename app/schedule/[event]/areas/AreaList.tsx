// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useMemo, useContext } from 'react';

import AlertTitle from '@mui/material/AlertTitle';
import Card from '@mui/material/Card';
import MapsHomeWorkIcon from '@mui/icons-material/MapsHomeWork';

import type { CardTimeslot } from '../components/CardTimeslotEntry';
import { Alert } from '../components/Alert';
import { CardTimeslotList } from '../components/CardTimeslotList';
import { HeaderButton } from '../components/HeaderButton';
import { ScheduleContext } from '../ScheduleContext';
import { currentZonedDateTime } from '../CurrentTime';
import { setTitle } from '../ScheduleTitle';

/**
 * The <AreaList> component displays an overview of the areas part of this festival's location. Each
 * area links through to an overview of locations within that area.
 */
export function AreaList() {
    const { schedule } = useContext(ScheduleContext);

    const [ now, areas ] = useMemo(() => {
        const now = currentZonedDateTime();
        if (!schedule)
            return [ now, [ /* no areas */ ] ];

        const nowEpochSeconds = now.epochSeconds;

        const areas = Object.values(schedule.program.areas).map(area => {
            const timeslots: CardTimeslot[] = [];

            for (const locationId of area.locations) {
                for (const timeslotId of schedule.program.locations[locationId].timeslots) {
                    const timeslot = schedule.program.timeslots[timeslotId];
                    if (timeslot.end <= nowEpochSeconds || timeslot.start > nowEpochSeconds)
                        continue;

                    const activity = schedule.program.activities[timeslot.activity];
                    timeslots.push({
                        id: timeslot.id,
                        activityId: timeslot.activity,
                        start: timeslot.start,
                        end: timeslot.end,
                        title: activity.title,
                        invisible: activity.invisible,
                    });
                }
            }

            timeslots.sort((lhs, rhs) => lhs.end - rhs.end);

            return {
                id: area.id,
                name: area.name,
                timeslots,
            };
        });

        areas.sort((lhs, rhs) => lhs.name.localeCompare(rhs.name));
        return [ now, areas ];

    }, [ schedule ]);

    if (!schedule)
        return undefined;

    setTitle('Events');

    const noEventsText = 'There are no active events in this area';
    const prefix = `/schedule/${schedule.slug}`;

    return (
        <>
            { !areas.length &&
                <Alert elevation={1} severity="error">
                    <AlertTitle>No areas could be found!</AlertTitle>
                    The festival's areas have not been announced yet.
                </Alert> }

            { Object.values(areas).map(area =>
                <Card key={area.id}>
                    <HeaderButton href={`${prefix}/areas/${area.id}`} title={area.name}
                                  icon={ <MapsHomeWorkIcon color="primary" /> } />
                    <CardTimeslotList currentTime={now} prefix={prefix}
                                      timeslots={area.timeslots} noEventsText={noEventsText} />
                </Card> ) }
        </>
    );
}
