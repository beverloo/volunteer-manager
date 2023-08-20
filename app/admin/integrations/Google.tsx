// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

/**
 * Settings applicable to the <Google> component that can be edited through this component.
 */
export interface GoogleSettings {
    /**
     * The credential that should be used for communicating with Google APIs.
     */
    credential: string;

    /**
     * The physical location in which Google API calls should be executed.
     */
    location: string;

    /**
     * The Google Project ID through which Google API calls will be billed.
     */
    projectId: string;
}

/**
 * Props accepted by the <Google> component.
 */
export interface GoogleProps {
    /**
     * The settings for which this integration should be displayed.
     */
    settings: GoogleSettings;
}

/**
 * The <Google> component displays the available configuration that we use for accessing Google's
 * services. Service administrators further have the option of changing all settings.
 */
export function Google(props: GoogleProps) {
    const { settings } = props;

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5">
                Google
            </Typography>
        </Paper>
    );
}
