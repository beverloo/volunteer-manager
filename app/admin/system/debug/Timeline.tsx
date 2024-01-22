// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { AvailabilityTimeline, type AvailabilityTimeslot } from '@beverloo/volunteer-manager-timeline';
import '@beverloo/volunteer-manager-timeline/dist/volunteer-manager-timeline.css';

import { dayjs } from '@lib/DateTime';

/**
 * Proof-of-concept timeline component, strictly used as a client-side component.
 */
export function Timeline() {
    const min = '2024-06-07T00:00:00Z';
    const max = '2024-06-10T00:00:00Z';

    const timeslots: AvailabilityTimeslot[] = [
        {
            start: '2024-06-07T08:00:00Z',
            end: '2024-06-07T12:00:00Z',
            state: 'unavailable',
        },
        {
            start: '2024-06-08T12:00:00Z',
            end: '2024-06-08T13:30:00Z',
            state: 'avoid',
        },
        {
            start: '2024-06-09T12:30:00Z',
            end: '2024-06-09T14:15:00Z',
            state: 'available',
        }
    ];

    return (
        <AvailabilityTimeline dayjs={dayjs} min={min} max={max} theme="light"
                              timeslots={timeslots} />
    );
}
