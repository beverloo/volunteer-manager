// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { UnderConstructionPaper } from '@app/admin/UnderConstructionPaper';

/**
 * Props accepted by the <VolunteerAvailability> component.
 */
export interface VolunteerAvailabilityProps {
    // TODO
}

/**
 * The <VolunteerAvailability> component displays the indicated availability from this volunteer. It
 * will be incorporated in the schedule tool as well. Entries can be added and removed from here.
 */
export function VolunteerAvailability(props: VolunteerAvailabilityProps) {
    return (
        <UnderConstructionPaper>
            Availability
        </UnderConstructionPaper>
    );
}
