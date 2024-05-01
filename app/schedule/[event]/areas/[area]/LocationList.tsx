// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useContext, useMemo } from 'react';

import AlertTitle from '@mui/material/AlertTitle';
import Card from '@mui/material/Card';
import ReadMoreIcon from '@mui/icons-material/ReadMore';

import { Alert } from '../../components/Alert';
import { CardTimeslotList } from '../../components/CardTimeslotList';
import { HeaderButton } from '../../components/HeaderButton';
import { ScheduleContext } from '../../ScheduleContext';
import { currentInstant } from '../../CurrentTime';

/**
 * Props accepted by the <LocationList> component.
 */
export interface LocationListProps {
    /**
     * Unique ID of the area, as should be known in the schedule's program.
     */
    areaId: string;
}

/**
 * The <LocationList> component displays an overview of the locations part of a particular area. The
 * data is sourced from the schedule context, and will be dynamically updated with schedule changes.
 */
export function LocationList(props: LocationListProps) {
    const now = currentInstant();

    const schedule = useContext(ScheduleContext);
    const locations = useMemo(() => {
        if (!schedule || !schedule.program.areas.hasOwnProperty(props.areaId))
            return [ /* no locations */ ];

        const now = currentInstant();  // deliberate shadow

        const area = schedule.program.areas[props.areaId];
        const locations = area.locations.map(locationId => {
            const location = schedule.program.locations[locationId];
            const timeslots = location.timeslots
                .map(timeslotId => schedule.program.timeslots[timeslotId])
                .filter(timeslot => timeslot.end > now.epochSeconds)
                .sort((lhs, rhs) => lhs.start - rhs.start)  // todo: on the server
                .map(timeslot => ({
                    id: timeslot.id,
                    activityId: timeslot.activity,
                    start: timeslot.start,
                    end: timeslot.end,
                    title: schedule.program.activities[timeslot.activity].title
                }))
                .slice(0, schedule.config.activityListLimit);

            return {
                id: location.id,
                name: location.name,
                timeslots,
            };
        });

        locations.sort((lhs, rhs) => lhs.name.localeCompare(rhs.name));
        return locations;

    }, [ props.areaId, schedule ]);

    if (!schedule)
        return undefined;

    if (!schedule.program.areas.hasOwnProperty(props.areaId))
        return undefined;  // TODO: 404?

    const prefix = `/schedule/${schedule.slug}`;

    return (
        <>
            { !locations.length &&
                <Alert elevation={1} severity="error">
                    <AlertTitle>No locations could be found!</AlertTitle>
                    The locations in this area have not been announced yet.
                </Alert> }

            { Object.values(locations).map(location =>
                <Card key={location.id}>
                    <HeaderButton href={`${prefix}/locations/${location.id}`} title={location.name}
                                  icon={ <ReadMoreIcon color="primary" /> } />
                    <CardTimeslotList currentInstant={now} prefix={prefix}
                                      timeslots={location.timeslots} />
                </Card> ) }
        </>
    );
}
