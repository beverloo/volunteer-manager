// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import type { PageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import { Temporal } from '@lib/Temporal';

import { ShiftTimeline } from '@beverloo/volunteer-manager-timeline';
import '@beverloo/volunteer-manager-timeline/dist/volunteer-manager-timeline.css';

/**
 * Props accepted by the <VolunteerSchedule> component.
 */
export interface VolunteerScheduleProps {
    /**
     * Information about the event this volunteer will participate in.
     */
    event: PageInfo['event'];
}

/**
 * The <VolunteerSchedule> component displays a timeline with the schedule for this volunteer,
 * which displays all their (un)availability and shifts in a concise manner.
 */
export function VolunteerSchedule(props: VolunteerScheduleProps) {
    const { event } = props;

    const min = Temporal.ZonedDateTime.from(event.startTime)
        .withTimeZone(event.timezone).with({ hour: 6, minute: 0, second: 0 })
            .toString({ timeZoneName: 'never' });

    const max = Temporal.ZonedDateTime.from(event.endTime)
        .withTimeZone(event.timezone).with({ hour: 22, minute: 0, second: 0 })
            .toString({ timeZoneName: 'never' });

    return (
        <ShiftTimeline temporal={Temporal} min={min} max={max} defaultGroup={0} readOnly
                       groups={[]} immutableEntries={[]} />
    );
}
