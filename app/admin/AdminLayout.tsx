// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Grid from '@mui/material/Unstable_Grid2';

/**
 *
 */
export interface AdminLayoutProps {
    /**
     *
     */
    header?: React.ReactNode;

    /**
     *
     */
    sidebar?: React.ReactNode;
}

/**
 *
 */
export function AdminLayout(props: React.PropsWithChildren<AdminLayoutProps>) {
    return (
        <Grid container>
            <Grid xs={3}>
                {props.sidebar}
            </Grid>
            <Grid xs={9}>
                {props.header}
                {props.children}
            </Grid>
        </Grid>
    );
}
