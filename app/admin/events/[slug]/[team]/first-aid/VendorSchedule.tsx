// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';

import type { PageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import type { VendorScheduleEntry } from '@app/api/admin/vendors/updateVendorSchedule';
import { Schedule, type ScheduleEvent, type ScheduleMarker, type ScheduleResource } from '@app/admin/components/Schedule';
import { Temporal } from '@lib/Temporal';
import { VendorTeam } from '@lib/database/Types';
import { callApi } from '@lib/callApi';

/**
 * Colour assigned to each entry on the vendor schedule.
 */
const kScheduleColor = '#00796b';

/**
 * Title assigned to each entry on the vendor schedule.
 */
const kScheduleTitle = 'Work period';

/**
 * Interface that describes the information that the vendor's schedule should be populated with.
 * Contains information about both timing and appearance.
 */
export interface VendorScheduleDisplayEntry {
    /**
     * Unique ID of the vendor for whom this entry exists.
     */
    id: number;

    /**
     * Full name of this vendor, as it should appear in the schedule.
     */
    name: string;

    /**
     * Role of the vendor.
     */
    role: string;

    /**
     * Scheduled shifts that exist for this vendor.
     */
    schedule: Omit<VendorScheduleEntry, 'vendorId'>[];
}

/**
 * Props accepted by the <VendorSchedule> component.
 */
export interface VendorScheduleProps {
    /**
     * The event for which the schedule is being displayed.
     */
    event: PageInfo['event'];

    /**
     * Name of the vendor team for which data is being shown.
     */
    team: VendorTeam;

    /**
     * The roles, in order of them being displayed in the schedule.
     */
    roles: string[];

    /**
     * The schedule that has been assigned to this vendor team.
     */
    schedule: VendorScheduleDisplayEntry[];
}

/**
 * The <VendorSchedule> component displays a schedule for each of the vendors helping out in this
 * team during the selected event. The vendors are grouped by role.
 */
export function VendorSchedule(props: VendorScheduleProps) {
    const { event, team, roles, schedule } = props;

    // ---------------------------------------------------------------------------------------------
    // Prepare the events
    // ---------------------------------------------------------------------------------------------

    const [ events, setEvents ] = useState<ScheduleEvent[]>(
        schedule.map(vendor => vendor.schedule.map(schedule => ({
            id: schedule.id,
            start: Temporal.ZonedDateTime.from(schedule.start).toString({ timeZoneName: 'never' }),
            end: Temporal.ZonedDateTime.from(schedule.end).toString({ timeZoneName: 'never' }),
            title: kScheduleTitle,
            color: kScheduleColor,
            resource: vendor.id,
        }))).flat());

    // ---------------------------------------------------------------------------------------------
    // Prepare the presentation
    // ---------------------------------------------------------------------------------------------

    const [ markers, resources ] = useMemo(() => {
        const markers: ScheduleMarker[] = [];
        const resources: ScheduleResource[] = [];

        // Step 1: Group the resources included in the `schedule`, and create a marker ahead of the
        // event's start time, which our calendar component gets wrong:
        const vendorsByRole: { [key: string]: ScheduleResource[] } = {};
        for (const vendor of schedule) {
            if (!Object.hasOwn(vendorsByRole, vendor.role))
                vendorsByRole[vendor.role] = [];

            markers.push({
                resource: vendor.id,
                background: '#f4f4f4',
                start: Temporal.ZonedDateTime.from(event.startTime)
                    .withTimeZone(event.timezone).with({ hour: 0, minute: 0, second: 0 })
                        .toString({ timeZoneName: 'never' }),
                end: Temporal.ZonedDateTime.from(event.startTime)
                    .withTimeZone(event.timezone).with({ hour: 4, minute: 30, second: 0 })
                        .toString({ timeZoneName: 'never' }),
            });

            vendorsByRole[vendor.role].push({
                id: vendor.id,
                name: vendor.name,
            });
        }

        // Step 2: Populate the `resources` in the order of the defined `roles`:
        for (const role of roles) {
            if (!Object.hasOwn(vendorsByRole, role))
                continue;  // not all roles are required for each event

            resources.push({
                id: `group/${role}`,
                name: role,
                children: vendorsByRole[role],
            });
        }

        return [ markers, resources ];

    }, [ event.startTime, event.timezone, roles, schedule ]);

    // ---------------------------------------------------------------------------------------------
    // Update when mutations are made
    // ---------------------------------------------------------------------------------------------

    // TODO

    // ---------------------------------------------------------------------------------------------

    const eventDefaults: Partial<ScheduleEvent> = {
        color: kScheduleColor,
        title: kScheduleTitle,
        dragBetweenResources: false,
    };

    const min = Temporal.ZonedDateTime.from(event.startTime)
        .withTimeZone(event.timezone).with({ hour: 1, minute: 30, second: 0 })
            .toString({ timeZoneName: 'never' });

    const max = Temporal.ZonedDateTime.from(event.endTime)
        .withTimeZone(event.timezone).with({ hour: 23, minute: 30, second: 0 })
            .toString({ timeZoneName: 'never' });

    return (
        <>
            <Divider sx={{ mx: '-16px !important' }} />
            <Box sx={{ mx: '-16px !important', mt: '0px !important', mb: '-16px !important' }}>
                <Schedule min={min} max={max} displayTimezone={event.timezone}
                          resources={resources} eventDefaults={eventDefaults}
                          eventOverlap={false} events={events} markers={markers} subject="shift" />
            </Box>
        </>
    );
}
