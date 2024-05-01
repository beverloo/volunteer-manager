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
import { currentInstant } from '../CurrentTime';

/**
 * The <AreaList> component displays an overview of the areas part of this festival's location. Each
 * area links through to an overview of locations within that area.
 */
export function AreaList() {
    const now = currentInstant();

    const schedule = useContext(ScheduleContext);
    const areas = useMemo(() => {
        if (!schedule)
            return [ /* no areas */ ];

        const now = currentInstant();  // deliberate shadow

        const areas = Object.values(schedule.program.areas).map(area => {
            const active: CardTimeslot[] = [];
            const pending: CardTimeslot[] = [];

            for (const locationId of area.locations) {
                for (const timeslotId of schedule.program.locations[locationId].timeslots) {
                    const timeslot = schedule.program.timeslots[timeslotId];
                    if (timeslot.end < now.epochSeconds)
                        continue;

                    const activity = schedule.program.activities[timeslot.activity];

                    const entry: CardTimeslot = {
                        id: timeslot.id,
                        activityId: timeslot.activity,
                        start: timeslot.start,
                        end: timeslot.end,
                        title: activity.title,
                        invisible: activity.invisible,
                    };

                    if (timeslot.start < now.epochSeconds)
                        active.push(entry);
                    else
                        pending.push(entry);

                    if (pending.length >= schedule.config.activityListLimit)
                        break;
                }
            }

            const timeslots = [
                ...active,
                ...pending.splice(0, schedule.config.activityListLimit - active.length),
            ];

            timeslots.sort((lhs, rhs) => lhs.start - rhs.start);

            return {
                id: area.id,
                name: area.name,
                timeslots,
            };
        });

        areas.sort((lhs, rhs) => lhs.name.localeCompare(rhs.name));
        return areas;

    }, [ schedule ]);

    if (!schedule)
        return undefined;

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
                    <CardTimeslotList currentInstant={now} prefix={prefix}
                                      timeslots={area.timeslots} />
                </Card> ) }
        </>
    );
}
