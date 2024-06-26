// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Unstable_Grid2';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { kStyles } from '../registration/RegistrationHeader';

/**
 * Props accepted by the <DashboardContainer> component.
 */
interface DashboardContainerProps {
    /**
     * Title that should be displayed at the top of the container, if any.
     */
    title?: string;
}

/**
 * The <DashboardContainer> component is a MUI Paper panel with a header describing what it contains
 * and one or more graphs (injected as children) displaying the actual data.
 */
export function DashboardContainer(props: React.PropsWithChildren<DashboardContainerProps>) {
    return (
        <Paper elevation={2}>
            { props.title &&
                <Stack direction="row" justifyContent="space-between" sx={kStyles.header}>
                    <Typography sx={kStyles.text} variant="h5" component="h1" noWrap>
                        {props.title}
                    </Typography>
                </Stack> }
            <Box sx={{ p: 2 }}>
                <Grid container spacing={2}>
                    {props.children}
                </Grid>
            </Box>
        </Paper>
    );
}
