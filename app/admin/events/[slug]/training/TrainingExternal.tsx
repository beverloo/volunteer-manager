// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { UnderConstructionPaper } from '@app/admin/UnderConstructionPaper';

/**
 * Props accepted by the <TrainingExternal> component.
 */
export interface TrainingExternalProps {
    // TODO
}

/**
 * The <TrainingExternal> component displays the extra people who may want to join in the training
 * sessions, outside of the volunteers we have within our team.
 */
export function TrainingExternal(props: TrainingExternalProps) {
    return (
        <UnderConstructionPaper>
            Extra participants
        </UnderConstructionPaper>
    );
}
