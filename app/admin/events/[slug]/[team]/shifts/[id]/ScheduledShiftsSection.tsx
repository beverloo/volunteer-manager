// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useMemo } from 'react';

import type { PageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import type { ShiftDemandTimelineGroup } from './ShiftDemandTimeline';
import { Temporal } from '@lib/Temporal';

import { ShiftTimeline, type ShiftEntry, type ShiftGroup } from '@beverloo/volunteer-manager-timeline';
import '@beverloo/volunteer-manager-timeline/dist/volunteer-manager-timeline.css';

/**
 * Props accepted by the <ScheduledShiftsSection> component.
 */
export interface ScheduledShiftsSectionProps {
    /**
     * Information about the event for which the demand section is being shown.
     */
    event: PageInfo['event'];

    /**
     * The groups (read: teams) for whom shifts have been scheduled.
     */
    groups: ShiftDemandTimelineGroup[];
}

/**
 * The <ScheduledShiftsSection> component displays the shifts that have actually been scheduled and
 * are assigned to particular volunteers. The view combines shifts from all different teams.
 */
export function ScheduledShiftsSection(props: ScheduledShiftsSectionProps) {
    const { event } = props;

    const [ immutableEntries, groups ] = useMemo(() => {
        const immutableEntries: ShiftEntry[] = [];
        const groups: ShiftGroup[] = [];

        for (const { entries, metadata } of props.groups) {
            groups.push(metadata);
            immutableEntries.push(...entries);
        }

        return [ immutableEntries, groups ];

    }, [ props.groups ]);

    const min = Temporal.ZonedDateTime.from(event.startTime)
        .withTimeZone(event.timezone).with({ hour: 6, minute: 0, second: 0 })
            .toString({ timeZoneName: 'never' });

    const max = Temporal.ZonedDateTime.from(event.endTime)
        .withTimeZone(event.timezone).with({ hour: 22, minute: 0, second: 0 })
            .toString({ timeZoneName: 'never' });

    return (
        <ShiftTimeline temporal={Temporal} min={min} max={max} dataTimezone="utc" readOnly
                       displayTimezone={event.timezone} defaultGroup={/* invalid= */ 0}
                       groups={groups} immutableEntries={immutableEntries} mutableEntries={[]} />
    );
}
