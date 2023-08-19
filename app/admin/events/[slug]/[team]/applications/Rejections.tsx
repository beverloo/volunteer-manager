// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import type { ApplicationInfo } from './Applications';

/**
 * Props accepted by the <Rejections> component.
 */
export interface RejectionsProps {
    /**
     * The applications that were rejected.
     */
    applications: ApplicationInfo[];
}

/**
 * The <Rejections> component succintly displays which applications were previously rejected. Only
 * administrators can reinstate them, as communications have already gone out to the volunteer.
 */
export function Rejections(props: RejectionsProps) {
    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5">
                Rejections
            </Typography>
        </Paper>
    )
}
