// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { AvailabilityTimeline } from '@beverloo/volunteer-manager-timeline';
import '@beverloo/volunteer-manager-timeline/dist/volunteer-manager-timeline.css';

/**
 * Proof-of-concept timeline component, strictly used as a client-side component.
 */
export function Timeline() {
    const min = '2024-06-07T00:00:00Z';
    const max = '2024-06-09T00:00:00Z';

    return (
        <AvailabilityTimeline timeslots={[]} min={min} max={max} theme="light" />
    );
}
