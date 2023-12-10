// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

/**
 * Props accepted by the <SchedulerCreateTaskPanel> component.
 */
interface SchedulerCreateTaskPanelProps {

}

/**
 * The <SchedulerCreateTaskPanel> component shows a paper listing each of the tasks known to the
 * scheduler, which can be created through a Web interface.
 */
export function SchedulerCreateTaskPanel(props: SchedulerCreateTaskPanelProps) {
    // TODO: Display a table or grid or form with the tasks that exist and can be created through
    // the interface. MVP w/ a text box for the settings might be sufficient.

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5">
                Schedule a new task
            </Typography>
        </Paper>
    );
}
