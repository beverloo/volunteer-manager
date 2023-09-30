// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

/**
 * Information about an individual confirmation.
 */
export interface TrainingConfirmation {
    // TODO
}

/**
 * Props accepted by the <TrainingOverview> component.
 */
export interface TrainingOverviewProps {
    /**
     * Confirmed participation in trainings that can be shown in a tabular view.
     */
    confirmations: TrainingConfirmation[];
}

/**
 * The <TrainingOverview> component, only shown when there are confirmed trainings, displays the
 * final overview tables of who participates in which trainings.
 */
export function TrainingOverview(props: TrainingOverviewProps) {
    return (
        <Paper sx={{ p: 2, mt: 2 }}>
            <Typography variant="h5" sx={{ pb: 1 }}>
                Confirmed participation
            </Typography>
            TODO
        </Paper>
    );
}
