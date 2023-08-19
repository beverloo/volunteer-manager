// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import type { SxProps, Theme } from '@mui/system';
import Grid from '@mui/material/Unstable_Grid2';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import Typography from '@mui/material/Typography';

/**
 * Custom styles applied to the <Applications> component & friends.
 */
export const kStyles: { [key: string]: SxProps<Theme> } = {
    noApplicationsContainer: {
        backgroundColor: theme => theme.palette.mode === 'light' ? 'rgba(0, 0, 0, .05)'
                                                                 : 'rgba(255, 255, 255, .05)',

        border: '2px dashed rgba(0, 0, 0, .1)',
        padding: 2,
    }
};

/**
 * The <NoApplications> component will be shown when there are no pending applications. This is a
 * good state because it means that nobody is waiting for an answer.
 */
function NoApplications() {
    return (
        <Paper elevation={0} sx={kStyles.noApplicationsContainer}>
            <Stack direction="row" spacing={2} justifyContent="flex-start">
                <TaskAltIcon color="disabled" />
                <Typography sx={{ color: 'text.disabled' }}>
                    There are no pending applications
                </Typography>
            </Stack>
        </Paper>
    )
}

/**
 * Interface that describes the information that needs to be known for a pending application. Cards
 * will be shown displaying this in a structured manner.
 */
export interface ApplicationInfo {

}

/**
 * Props accepted by the <Application> component.
 */
interface ApplicationProps {
    /**
     * The application that's being displayed by this component.
     */
    application: ApplicationInfo;
}

/**
 * The <Application> component displays an individual application that can be inspected, and then
 * either approved or rejected. Not all volunteers are allowed to manage applications.
 */
function Application(props: ApplicationProps) {
    return (
        <Paper>
            Hi
        </Paper>
    )
}

/**
 * Props accepted by the <Applications> component.
 */
export interface ApplicationsProps {
    /**
     * The applications that are currently pending a response.
     */
    applications: ApplicationInfo[];
}

/**
 * The <Applications> component displays the pending applications which this volunteering team has
 * not yet responded to. Basic information is shown, and a decision can be made on this page by
 * event administrators and folks with the application management permissions.
 */
export function Applications(props: ApplicationsProps) {
    const { applications } = props;

    if (!applications.length)
        return <NoApplications />;

    return (
        <Grid container spacing={2}>
            { applications.map((application, index) =>
                <Grid key={index} xs={6}>
                    <Application application={application} />
                </Grid> )}
        </Grid>
    );
}
