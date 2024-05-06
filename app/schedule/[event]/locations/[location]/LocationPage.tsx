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

    if (!schedule || !schedule.program.locations.hasOwnProperty(props.locationId)) {
        return (
            <ErrorCard title="This location cannot be found!">
                The location that you tried to access cannot be found.
            </ErrorCard>
        );
    }

    const location = schedule.program.locations[props.locationId];

    return (
        <>
            <SetTitle title={location.name} />
            <Card>
                <CardHeader title={location.name}
                            titleTypographyProps={{ variant: 'subtitle2' }}
                            subheader={location.area} />
            </Card>
            { /* TODO: List of activities */ }
            { /* TODO: Redirect when there's only one unique activity */ }
        </>
    );
}
