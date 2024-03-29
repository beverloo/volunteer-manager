// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useContext, useMemo } from 'react';

import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';

import type { ScheduleEvent, ScheduleMarker, ScheduleResource } from '@app/admin/components/Schedule';
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

    const { events, markers, resources } = useMemo(() => {
        const events: ScheduleEvent[] = [];
        const markers: ScheduleMarker[] = [];
        const resources: ScheduleResource[] = [];

        if (!!context.schedule) {
            for (const roleResource of context.schedule.resources) {
                for (const humanResource of roleResource.children) {
                    // TODO: Process markers

                    if (!roleResource.collapsed && !events.length) {
                        events.push({
                            id: 'event/0',
                            start: '2024-06-07T14:00:00Z',
                            end: '2024-06-07T16:30:00Z',
                            title: 'Shift',
                            resource: humanResource.id,
                        });
                    }
                }

                resources.push({
                    ...roleResource,
                    name: `${roleResource.name} (${roleResource.children.length})`,
                });
            }
        }

        return { events, markers, resources };

    }, [ context.schedule ])

    // TODO: Scheduled shifts

    // ---------------------------------------------------------------------------------------------

    if (!context.schedule || !resources.length) {
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
            <Schedule min={context.schedule.min} max={context.schedule.max} events={events}
                      markers={markers} resources={resources}
                      displayTimezone={context.schedule.timezone} subject="shift" />
        </Paper>
    );
}
