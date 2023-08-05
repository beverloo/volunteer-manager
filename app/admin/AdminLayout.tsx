// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Grid from '@mui/material/Unstable_Grid2';
import { SxProps, Theme } from '@mui/system';

/**
 * Custom styles applied to the <AdminLayout> component.
 */
const kStyles: { [key: string]: SxProps<Theme> } = {
    root: {
        backgroundColor: '#f8faf0',
        padding: 2,
        minHeight: '100vh',
    },
    content: {
        backgroundColor: '#ffffff',
        borderRadius: 4,
    }
};

/**
 * Props accepted by the <AdminLayout> component.
 */
export interface AdminLayoutProps { /* no props yet */ }

/**
 * Base layout for the Volunteer Manager administration environment. This is where senior folks can
 * manage the portal, volunteers and everything related to that.
 */
export function AdminLayout(props: React.PropsWithChildren<AdminLayoutProps>) {
    return (
        <Grid sx={kStyles.root} container>
            <Grid xs={3}>
                x
            </Grid>
            <Grid sx={kStyles.content} xs={9}>
                x
            </Grid>
        </Grid>
    );
}
