// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { UnderConstructionPaper } from '@app/admin/UnderConstructionPaper';

/**
 * Props accepted by the <Availability> component.
 */
export interface AvailabilityProps {
    // TODO
}

/**
 * The <Availability> component displays the indicated availability from this volunteer. It will be
 * incorporated in the schedule tool as well. Entries can be added and removed from here.
 */
export function Availability(props: AvailabilityProps) {
    return (
        <UnderConstructionPaper>
            Availability
        </UnderConstructionPaper>
    );
}
