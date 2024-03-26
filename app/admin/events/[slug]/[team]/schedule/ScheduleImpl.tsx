// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { SectionIntroduction } from '@app/admin/components/SectionIntroduction';

import type { ScheduleMarker, ScheduleResource } from '@app/admin/components/Schedule';
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
    const markers: ScheduleMarker[] = [

    ];

    const resources: ScheduleResource[] = [
        {
            id: 'staff',
            name: 'Staff',

            collapsed: true,
            children: [
                { id: 1, name: 'Aiden' },
                { id: 2, name: 'Alex' }
            ],

            eventCreation: false,
        },
        {
            id: 'seniors',
            name: 'Seniors',

            children: [
                { id: 10, name: 'Carter' },
                { id: 20, name: 'Ellis' },
                { id: 30, name: 'Hayden' }
            ],

            eventCreation: false,
        },
        {
            id: 'stewards',
            name: 'Stewards',

            children: [
                { id: 100, name: 'Jude' },
                { id: 200, name: 'Kit' },
                { id: 300, name: 'Lane' },
                { id: 400, name: 'Remi' },
                { id: 500, name: 'Robin' },
                { id: 600, name: 'Storm' },
            ],

            eventCreation: false,
        }
    ];

    const min = '2024-06-07T10:00:00+02:00';
    const max = '2024-06-09T22:00:00+02:00';

    return (
        <Schedule min={min} max={max} markers={markers} resources={resources}
                  displayTimezone="Europe/Amsterdam" />
    );
}
