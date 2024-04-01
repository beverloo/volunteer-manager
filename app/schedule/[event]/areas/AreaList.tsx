// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useContext } from 'react';

import AlertTitle from '@mui/material/AlertTitle';
import Card from '@mui/material/Card';
import MapsHomeWorkIcon from '@mui/icons-material/MapsHomeWork';
import Typography from '@mui/material/Typography';

import { Alert } from '../components/Alert';
import { HeaderButton } from '../components/HeaderButton';
import { ScheduleContext } from '../ScheduleContext';

/**
 * The <AreaList> component displays an overview of the areas part of this festival's location. Each
 * area links through to an overview of locations within that area.
 */
export function AreaList() {
    const schedule = useContext(ScheduleContext);
    if (!schedule)
        return undefined;

    const areas = Object.values(schedule.program.areas);

    return (
        <>
            { !areas.length &&
                <Alert elevation={1} severity="error">
                    <AlertTitle>No areas could be found!</AlertTitle>
                    The festival's areas have not been announced yet.
                </Alert> }

            { Object.values(areas).map(area =>
                <Card key={area.id}>
                    <HeaderButton href={`./areas/${area.id}`} title={area.name}
                                  icon={ <MapsHomeWorkIcon color="primary" /> } />
                    <Typography variant="body1" sx={{ color: 'text.disabled', pl: 2, pb: 1 }}>
                        Coming soon…
                    </Typography>
                </Card> ) }
        </>
    );
}
