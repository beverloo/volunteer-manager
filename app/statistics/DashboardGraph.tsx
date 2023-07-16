// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Grid from '@mui/material/Unstable_Grid2';

/**
 * Props accepted by the <DashboardGraph> component.
 */
export interface DashboardGraphProps {
    /**
     * The actual graph that should render within the graph container.
     */
    children: React.ReactNode;

    /**
     * Whether the graph should be full width, otherwise we might stack them aside.
     */
    fullWidth?: boolean;
}

/**
 * Individual graph container that should be displayed on the dashboard. Should have a single child
 * that is the graph to display, which depends on the sort of data to include.
 */
export function DashboardGraph(props: DashboardGraphProps) {
    const { children, fullWidth } = props;

    return (
        <Grid xs={12} md={fullWidth ? 12 : 6}>
            {children}
        </Grid>
    );
}
