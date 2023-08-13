// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { UnderConstructionPaper } from '@app/admin/UnderConstructionPaper';

/**
 * Props accepted by the <HotelPendingAssignment> component.
 */
export interface HotelPendingAssignmentProps {
    // TODO
}

/**
 * The <HotelPendingAssignment> component displays the volunteers who have expressed interest in
 * having a hotel room booking, but have not been assigned a room just yet.
 */
export function HotelPendingAssignment(props: HotelPendingAssignmentProps) {
    return (
        <UnderConstructionPaper>
            Pending assignment
        </UnderConstructionPaper>
    );
}
