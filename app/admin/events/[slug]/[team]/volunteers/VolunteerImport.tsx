// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

/**
 * Props accepted by the <VolunteerImport> component.
 */
export interface VolunteerImportProps {

}

/**
 * The <VolunteerImport> component allows certain users to immediately "import" users to this team
 * by adding them directly, without going through the normal application process. The person who is
 * being added to the team still needs to have created an account with the Volunteer Manager.
 */
export function VolunteerImport(props: VolunteerImportProps) {
    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ pb: 2 }}>
                Add a volunteer
            </Typography>
        </Paper>
    )
}
