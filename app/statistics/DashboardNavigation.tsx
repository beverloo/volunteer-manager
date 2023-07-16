// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Button from '@mui/material/Button';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';

/**
 * The <DashboardNavigation> component is displayed at the top of the dashboard and provides the
 * user with the ability to navigate back and forth between different displays. It hooks in to the
 * router to figure out what to display as the active page.
 */
export function DashboardNavigation() {
    return (
        <Paper elevation={2} sx={{ p: { xs: 0, md: 1 } }}>
            <Stack direction="row" spacing={2}>
                <Button>
                    Dashboard
                </Button>
                <Button endIcon={ <ExpandMoreIcon /> }>
                    Events
                </Button>
            </Stack>
        </Paper>
    );
}
