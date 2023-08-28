// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { UnderConstructionPaper } from '@app/admin/UnderConstructionPaper';

/**
 * Props accepted by the <TrainingConfiguration> component.
 */
export interface TrainingConfigurationProps {
    // TODO
}

/**
 * The <TrainingConfiguration> component displays the options that are available for our volunteers
 * to get trained ahead of the convention. This is a fairly straightforward set of dates.
 */
export function TrainingConfiguration(props: TrainingConfigurationProps) {
    return (
        <UnderConstructionPaper>
            Training options
        </UnderConstructionPaper>
    );
}
