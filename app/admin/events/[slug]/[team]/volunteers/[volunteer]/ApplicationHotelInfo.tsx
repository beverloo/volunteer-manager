// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { UnderConstructionPaper } from '@app/admin/UnderConstructionPaper';

/**
 * Props accepted by the <ApplicationHotelInfo> component.
 */
export interface ApplicationHotelInfoProps {
    // TODO
}

/**
 * The <ApplicationHotelInfo> component displays information about this volunteer's hotel
 * preferences. Allocation can be managed through the Hotel tool, available to event administrators.
 */
export function ApplicationHotelInfo(props: ApplicationHotelInfoProps) {
    return (
        <UnderConstructionPaper>
            Hotel preferences
        </UnderConstructionPaper>
    );
}
