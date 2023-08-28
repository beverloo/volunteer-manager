// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { UnderConstructionPaper } from '@app/admin/UnderConstructionPaper';

/**
 * Props accepted by the <TrainingPendingAssignment> component.
 */
export interface TrainingPendingAssignmentProps {
    // TODO
}

/**
 * The <TrainingPendingAssignment> component displays the volunteers who have expressed interest in
 * participating in the training, including extra people, but have not been assigned a place yet.
 */
export function TrainingPendingAssignment(props: TrainingPendingAssignmentProps) {
    return (
        <UnderConstructionPaper>
            Pending assignment
        </UnderConstructionPaper>
    );
}
