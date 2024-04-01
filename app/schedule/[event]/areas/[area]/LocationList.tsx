// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useContext } from 'react';

import AlertTitle from '@mui/material/AlertTitle';
import Card from '@mui/material/Card';
import ReadMoreIcon from '@mui/icons-material/ReadMore';
import Typography from '@mui/material/Typography';

import { Alert } from '../../components/Alert';
import { HeaderButton } from '../../components/HeaderButton';
import { ScheduleContext } from '../../ScheduleContext';

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
    const schedule = useContext(ScheduleContext);
    if (!schedule)
        return undefined;

    if (!schedule.program.areas.hasOwnProperty(props.areaId))
        return undefined;  // TODO: 404?

    const area = schedule.program.areas[props.areaId];
    const locations = area.locations.map(locationId => schedule.program.locations[locationId]);

    locations.sort((lhs, rhs) => lhs.name.localeCompare(rhs.name));

    return (
        <>
            { !locations.length &&
                <Alert elevation={1} severity="error">
                    <AlertTitle>No locations could be found!</AlertTitle>
                    The locations in this area have not been announced yet.
                </Alert> }

            { Object.values(locations).map(location =>
                <Card key={location.id}>
                    <HeaderButton href={`../locations/${location.id}`} title={location.name}
                                  icon={ <ReadMoreIcon color="primary" /> } />
                    <Typography variant="body1" sx={{ color: 'text.disabled', pl: 2, pb: 1 }}>
                        Coming soon…
                    </Typography>
                </Card> ) }
        </>
    );
}
