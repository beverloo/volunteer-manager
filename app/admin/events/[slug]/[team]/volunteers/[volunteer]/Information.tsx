// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

/**
 * Props accepted by the <Information> component.
 */
export interface InformationProps {

}

/**
 * The <Information> component displays the application information the user entered when they
 * requested to join the team, which can be editted by volunteers with access to this page.
 */
export function Information(props: InformationProps) {

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5">
                Information
            </Typography>
        </Paper>
    );
}
