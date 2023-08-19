// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { UnderConstructionPaper } from '@app/admin/UnderConstructionPaper';

/**
 * Props accepted by the <HotelInformation> component.
 */
export interface HotelInformationProps {
    // TODO
}

/**
 * The <HotelInformation> component displays information about this volunteer's hotel preferences.
 * Room allocation can be managed through the Hotel tool, available to event administrators.
 */
export function HotelInformation(props: HotelInformationProps) {
    return (
        <UnderConstructionPaper>
            Hotel information
        </UnderConstructionPaper>
    );
}
