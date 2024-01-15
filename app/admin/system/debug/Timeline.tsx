// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { AvailabilityTimeline } from '@beverloo/volunteer-manager-timeline';
import '@beverloo/volunteer-manager-timeline/dist/volunteer-manager-timeline.css';

/**
 * Proof-of-concept timeline component, strictly used as a client-side component.
 */
export function Timeline() {
    return (
        <AvailabilityTimeline timeslots={[]} />
    );
}
