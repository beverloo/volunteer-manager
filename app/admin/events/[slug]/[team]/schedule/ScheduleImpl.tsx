// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useContext, useMemo } from 'react';

import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';

import type { ScheduleMarker, ScheduleResource } from '@app/admin/components/Schedule';
import { ScheduleContext } from './ScheduleContext';
import { Schedule } from '@app/admin/components/Schedule';

/**
 * Props accepted by the <ScheduleImpl> component.
 */
export interface ScheduleImplProps {
    // TODO
}

/**
 * The <ScheduleImpl> component displays the actual volunteering schedule. It uses a scheduling
 * component from our calendar library, and shows all the volunteers and shifts in chronological
 * order. Furthermore, it supports all filtering options elsewhere in the user interface.
 */
export function ScheduleImpl(props: ScheduleImplProps) {
    const context = useContext(ScheduleContext);

    // ---------------------------------------------------------------------------------------------
    // Compose the resources that should be shown on the schedule
    // ---------------------------------------------------------------------------------------------

    const { markers, resources } = useMemo(() => {
        const markers: ScheduleMarker[] = [];
        const resources: ScheduleResource[] = [];

        if (!!context.schedule) {
            for (const roleResource of context.schedule.resources) {
                for (const humanResource of roleResource.children) {
                    // TODO: Process markers
                }

                resources.push({
                    ...roleResource,
                    name: `${roleResource.name} (${roleResource.children.length})`,
                });
            }
        }

        return { markers, resources };

    }, [ context.schedule ])

    // TODO: Scheduled shifts

    // ---------------------------------------------------------------------------------------------

    // TODO: Apply the different date ranges
    const min = '2024-06-07T10:00:00+02:00';
    const max = '2024-06-09T22:00:00+02:00';

    if (!resources.length) {
        return (
            <Paper sx={{ p: 2 }}>
                <Skeleton animation="wave" height={12} width="91%" />
                <Skeleton animation="wave" height={12} width="98%" />
                <Skeleton animation="wave" height={12} width="93%" />
                <Skeleton animation="wave" height={12} width="85%" />
            </Paper>
        );
    }

    return (
        <Paper>
            <Schedule min={min} max={max} markers={markers} resources={resources}
                      displayTimezone="Europe/Amsterdam" subject="shift" />
        </Paper>
    );
}
