// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Grid from '@mui/material/Unstable_Grid2';
import { SxProps, Theme } from '@mui/system';

/**
 *
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
        <Grid sx={kStyles.root} container>
            <Grid xs={3}>
                {props.sidebar}
            </Grid>
            <Grid sx={kStyles.content} xs={9}>
                {props.header}
                {props.children}
            </Grid>
        </Grid>
    );
}
