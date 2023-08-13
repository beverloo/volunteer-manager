// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { UnderConstructionPaper } from '@app/admin/UnderConstructionPaper';

/**
 * Props accepted by the <HotelSelection> component.
 */
export interface HotelSelectionProps {
    // TODO
}

/**
 * The <HotelSelection> component displays the hotel rooms that have been compiled based on the
 * preferences expressed by the volunteers.
 */
export function HotelSelection(props: HotelSelectionProps) {
    return (
        <UnderConstructionPaper>
            Hotel selection
        </UnderConstructionPaper>
    );
}
