// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { UnderConstructionPaper } from '@app/admin/UnderConstructionPaper';

/**
 * Props accepted by the <TrainingInformation> component.
 */
export interface TrainingInformationProps {
    // TODO
}

/**
 * The <TrainingInformation> component displays information about this volunteer's training
 * preferences. Not all volunteers have to do the training, but everyone can be invited.
 */
export function TrainingInformation(props: TrainingInformationProps) {
    return (
        <UnderConstructionPaper>
            Training information
        </UnderConstructionPaper>
    );
}
