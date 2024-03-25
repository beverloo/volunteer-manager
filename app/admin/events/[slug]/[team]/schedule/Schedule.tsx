// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { SectionIntroduction } from '@app/admin/components/SectionIntroduction';

/**
 * Props accepted by the <Schedule> component.
 */
export interface ScheduleProps {
    // TODO
}

/**
 * The <Schedule> component displays the actual volunteering schedule. It uses a scheduling
 * component from our calendar library, and shows all the volunteers and shifts in chronological
 * order. Furthermore, it supports all filtering options elsewhere in the user interface.
 */
export function Schedule(props: ScheduleProps) {
    return (
        <SectionIntroduction important>
            The schedule tool has not been implemented yet.
        </SectionIntroduction>
    );
}
