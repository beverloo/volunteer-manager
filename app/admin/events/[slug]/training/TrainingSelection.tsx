// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { UnderConstructionPaper } from '@app/admin/UnderConstructionPaper';

/**
 * Props accepted by the <TrainingSelection> component.
 */
export interface TrainingSelectionProps {
    // TODO
}

/**
 * The <TrainingSelection> component displays the training sessions that have been compiled based
 * on the preferences expressed by the volunteers.
 */
export function TrainingSelection(props: TrainingSelectionProps) {
    return (
        <UnderConstructionPaper>
            Training selection
        </UnderConstructionPaper>
    );
}
